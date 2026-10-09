import { Directive, Input, OnDestroy, OnInit, TemplateRef, inject } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { PageEvent } from "@angular/material/paginator";
import { Router } from "@angular/router";
import { Observable, Subject, of } from "rxjs";
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, takeUntil } from "rxjs/operators";
import * as XLSX from "xlsx";
import { environment } from "src/environments/environment";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { UserService } from "src/app/core/services/user.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { accionesPlanMejoramiento } from "src/app/shared/utils/accionesPorRolYEstado";
import {
  HistorialRechazosData,
  ModalHistorialRechazosComponent,
} from "src/app/shared/elements/components/dialogs/modal-historial-rechazos/modal-historial-rechazos.component";
import type { AuditoriaFormulacionPlan } from "src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models";
import {
  ColumnaFormulacion,
  ConTodos,
  ConfigFlujo,
  DatosFilaVista,
  IndicadorFormulacion,
  OpcionEstadoPlan,
  TextosVistaFormulacion,
  iconosAccion,
  pluralHallazgos,
  pluralObservaciones,
} from "./formulacion.utilidades";

const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Respuesta del MID; ok=false cuando la petición falló. */
interface Consulta {
  ok: boolean;
  res: any;
}

/**
 * Lógica común de las vistas de Formulación de Planes: filtros, indicadores, tabla paginada
 * en el servidor, exportación, historial de observaciones y modal de flujo.
 * Las vistas comparten la plantilla compartido/vista-formulacion.html.
 *
 * @typeParam A Fila que devuelve el MID.
 * @typeParam R Resumen que devuelve el MID.
 * @typeParam G Grupos de estado de la vista.
 */
@Directive()
export abstract class VistaFormulacionBase<
  A extends AuditoriaFormulacionPlan,
  R,
  G extends string,
> implements OnInit, OnDestroy {
  @Input() rol!: string;

  protected readonly fb = inject(FormBuilder);
  protected readonly router = inject(Router);
  protected readonly dialog = inject(MatDialog);
  protected readonly planAuditoriaMid = inject(PlanAnualAuditoriaMid);
  protected readonly alertaService = inject(AlertService);
  private readonly parametrosUtilsService = inject(ParametrosUtilsService);
  private readonly userService = inject(UserService);
  private readonly descargaService = inject(DescargaService);

  // ── Configuración de cada vista ───────────────────────────
  abstract readonly textos: TextosVistaFormulacion;
  abstract readonly flujo: ConfigFlujo;
  abstract readonly indicadores: IndicadorFormulacion<R>[];
  abstract readonly opcionesEstadoPlan: OpcionEstadoPlan<G, R>[];
  abstract readonly columnas: ColumnaFormulacion<A>[];
  abstract readonly columnasIds: string[];

  /** Ruta del MID sin parámetros; la del resumen agrega /resumen. */
  protected abstract get rutaBase(): string;
  protected abstract estadosDeGrupo(grupo: ConTodos<G>): number[];
  protected abstract claseEstado(estadoId: number): string;
  /** Acciones de accionesPlanMejoramiento que la vista implementa. */
  protected abstract readonly accionesHabilitadas: string[];
  protected abstract mapearFila(auditoria: A): A & DatosFilaVista;
  abstract realizarAccion(fila: A & DatosFilaVista, accion: string): void;

  readonly pluralHallazgos = pluralHallazgos;
  readonly pluralObservaciones = pluralObservaciones;

  filtrosForm!: FormGroup;
  vigencias: Vigencia[] = [];
  readonly tiposEvaluacion = [
    { Id: environment.TIPO_EVALUACION.AUDITORIA_INTERNA_ID, Nombre: "Auditoría Interna" },
  ];

  resumen: R | null = null;
  dataSource = new MatTableDataSource<A & DatosFilaVista>([]);

  // Paginación server-side
  totalRegistros = 0;
  pageSize = 10;
  pageIndex = 0;
  readonly pageSizeOptions = [5, 10, 25, 50];

  protected personaId = 0;
  protected readonly _onDestroy = new Subject<void>();
  private readonly consultaResumen$ = new Subject<string>();
  private readonly consultaAuditorias$ = new Subject<string>();

  async ngOnInit(): Promise<void> {
    this.iniciarForm();
    this.escucharBusqueda();
    this.escucharConsultas();
    this.personaId = await this.userService.getPersonaId().catch(() => 0);
    this.cargarVigencias();
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private iniciarForm(): void {
    this.filtrosForm = this.fb.group({
      vigencia:       [null],
      tipoEvaluacion: [environment.TIPO_EVALUACION.AUDITORIA_INTERNA_ID],
      busqueda:       [""],
      grupoEstado:    ["TODOS"],
    });
  }

  private escucharBusqueda(): void {
    this.filtrosForm.get("busqueda")!.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this._onDestroy))
      .subscribe(() => this.aplicarFiltros());
  }

  /** switchMap descarta la respuesta anterior si los filtros cambian antes de que llegue. */
  private escucharConsultas(): void {
    this.consultaResumen$
      .pipe(switchMap((url) => this.consultar(url)), takeUntil(this._onDestroy))
      .subscribe(({ ok, res }) => { this.resumen = ok ? (res?.Data ?? null) : null; });

    this.consultaAuditorias$
      .pipe(switchMap((url) => this.consultar(url)), takeUntil(this._onDestroy))
      .subscribe(({ ok, res }) => {
        if (!ok) {
          this.dataSource.data = [];
          this.totalRegistros = 0;
          this.alertaService.showErrorAlert("Ocurrió un error al consultar las auditorías. Por favor, intente nuevamente.");
          return;
        }
        this.dataSource.data = (res?.Data ?? []).map((a: A) => this.mapearFila(a));
        this.totalRegistros = res?.MetaData?.Count ?? this.dataSource.data.length;
      });
  }

  private consultar(url: string): Observable<Consulta> {
    return this.planAuditoriaMid.get(url).pipe(
      map((res) => ({ ok: true, res })),
      catchError(() => of({ ok: false, res: null })),
    );
  }

  private cargarVigencias(): void {
    this.parametrosUtilsService.getVigencias().subscribe({
      next: (data) => {
        this.vigencias = data;
        // getVigencias viene ordenado desc: la primera es la más reciente
        if (data.length) {
          this.filtrosForm.patchValue({ vigencia: data[0].Id });
          this.recargar();
        }
      },
    });
  }

  // ── Filtros ───────────────────────────────────────────────
  /** Cambio de vigencia o tipo de evaluación: recarga indicadores y tabla. */
  recargar(): void {
    this.pageIndex = 0;
    this.cargarResumen();
    this.cargarAuditorias();
  }

  aplicarFiltros(): void {
    this.pageIndex = 0;
    this.cargarAuditorias();
  }

  seleccionarGrupo(grupo: ConTodos<G>): void {
    this.filtrosForm.patchValue({ grupoEstado: grupo });
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.filtrosForm.patchValue({ busqueda: "", grupoEstado: "TODOS" }, { emitEvent: false });
    this.aplicarFiltros();
  }

  manejarCambioPaginado(evento: PageEvent): void {
    this.pageIndex = evento.pageIndex;
    this.pageSize = evento.pageSize;
    this.cargarAuditorias();
  }

  // ── Consultas al MID ──────────────────────────────────────
  /** Parámetros propios de la vista que van en el resumen y en la tabla. */
  protected paramsExtra(): Record<string, string> {
    return {};
  }

  private cargarResumen(): void {
    const { vigencia, tipoEvaluacion } = this.filtrosForm.value;
    const params = new URLSearchParams({
      vigencia_id: String(vigencia),
      tipo_evaluacion_id: String(tipoEvaluacion),
      ...this.paramsExtra(),
    });
    this.consultaResumen$.next(`${this.rutaBase}/resumen?${params}`);
  }

  private cargarAuditorias(): void {
    const params = this.construirParams(this.pageSize, this.pageIndex * this.pageSize);
    this.consultaAuditorias$.next(`${this.rutaBase}?${params}`);
  }

  private construirParams(limit: number, offset: number): URLSearchParams {
    const v = this.filtrosForm.value;
    const params = new URLSearchParams({
      vigencia_id:        String(v.vigencia),
      tipo_evaluacion_id: String(v.tipoEvaluacion),
      limit:              String(limit),
      offset:             String(offset),
      ...this.paramsExtra(),
    });

    const estados = this.estadosDeGrupo(v.grupoEstado);
    if (estados.length)     params.set("estado_ids", estados.join(","));
    if (v.busqueda?.trim()) params.set("busqueda", v.busqueda.trim());

    return params;
  }

  /** Clase del chip, acciones del menú y si se resaltan las observaciones del auditor. */
  protected datosVista(auditoria: A): DatosFilaVista {
    const estadoId = auditoria.estado_plan_id;
    return {
      claseEstado: this.claseEstado(estadoId),
      acciones: (accionesPlanMejoramiento[this.rol]?.[estadoId] ?? []).filter((a) => this.accionesHabilitadas.includes(a)),
      mostrarObservaciones:
        estadoId === environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.RECHAZADO_PLAN_MEJORAMIENTO &&
        auditoria.total_observaciones > 0,
    };
  }

  abrirFlujo(modalFlujo: TemplateRef<unknown>): void {
    this.dialog.open(modalFlujo, {
      width: "900px",
      maxWidth: "95vw",
      ariaLabel: this.textos.tituloFlujo,
      panelClass: "modal-flujo-plan",
    });
  }

  // ── Acciones por fila ─────────────────────────────────────
  getIconoAccion(accion: string): string {
    return iconosAccion.get(accion) ?? "help_outline";
  }

  protected verObservaciones(fila: A): void {
    if (!fila.plan_mejoramiento_id) {
      this.alertaService.showAlert("Sin plan", "No hay plan de mejoramiento registrado para esta auditoría.");
      return;
    }

    const data: HistorialRechazosData = {
      auditoriaId: fila.plan_mejoramiento_id,
      estadoEndpoint: "plan-mejoramiento-estado",
      auditoriaIdReferencia: "plan_mejoramiento_id",
      estadoRevisionIds: [environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.REVISION_PLAN_MEJORAMIENTO_AUDITOR],
      estadoRechazoIds: [environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.RECHAZADO_PLAN_MEJORAMIENTO],
      titulo: "Historial de observaciones",
      descripcion: `Lista de motivos de rechazo y observaciones - Auditoría ${fila.titulo ?? ""}`,
    };

    this.dialog.open(ModalHistorialRechazosComponent, { width: "1000px", data });
  }

  // ── Exportar ──────────────────────────────────────────────
  /** Columnas que se agregan al archivo además de las de la tabla. */
  protected columnasExportacion(a: A): Record<string, unknown> {
    return {
      "Hallazgos": a.total_hallazgos,
      "Observaciones del Auditor": a.total_observaciones,
    };
  }

  exportarTabla(): void {
    const params = this.construirParams(0, 0);

    this.planAuditoriaMid.get(`${this.rutaBase}?${params}`).subscribe({
      next: (res) => {
        const auditorias: A[] = res?.Data ?? [];
        if (!auditorias.length) {
          this.alertaService.showAlert("Sin resultados", "No hay auditorías para exportar con los filtros aplicados.");
          return;
        }

        const columnasExportables = this.columnas.filter((c) => c.columnDef !== "acciones");
        const filas = auditorias.map((a) => ({
          ...Object.fromEntries(columnasExportables.map((c) => [c.header, c.cell(a)])),
          ...this.columnasExportacion(a),
        }));

        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(filas), "Auditorías");
        const buffer: ArrayBuffer = XLSX.write(libro, { bookType: "xlsx", type: "array" });
        const vigencia = this.vigencias.find((v) => v.Id === this.filtrosForm.value.vigencia)?.Nombre ?? "";
        this.descargaService.descargarArchivoBuffer(buffer, MIME_XLSX, `${this.textos.nombreExportacion}_${vigencia}`);
      },
      error: () => this.alertaService.showErrorAlert("No fue posible exportar la tabla."),
    });
  }
}
