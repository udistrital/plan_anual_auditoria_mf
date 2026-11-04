import { Directive, Input, OnDestroy, OnInit, inject } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { PageEvent } from "@angular/material/paginator";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable, Subject, forkJoin, of } from "rxjs";
import { catchError, map, switchMap, takeUntil } from "rxjs/operators";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { environment } from "src/environments/environment";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { UserService } from "src/app/core/services/user.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import type { AccionGestion, ResumenGestionAcciones } from "src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models";
import {
  HistorialRechazosData,
  ModalHistorialRechazosComponent,
} from "src/app/shared/elements/components/dialogs/modal-historial-rechazos/modal-historial-rechazos.component";
import {
  BotonFila,
  FiltroGrupo,
  TextosVistaGestion,
  chipsGrupo,
  columnasGestion,
  estadoPorGrupo,
  filaExportacion,
  indicadoresGestion,
  pluralSoportes,
  textoVencimiento,
} from "./gestion-acciones.utilidades";

const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type FilaVista = AccionGestion & {
  boton: BotonFila;
  vencimiento: ReturnType<typeof textoVencimiento>;
  /** Texto y clase del chip de estado; en la plantilla `row` es any y no permite indexar por grupo. */
  estado: { texto: string; clase: string };
};

/** Respuesta del MID; ok=false cuando la petición falló. */
interface Consulta {
  ok: boolean;
  res: any;
}

/**
 * Lógica común de las vistas de Gestión de Acciones: filtros, indicadores, tabla paginada
 * en el servidor, exportación y navegación a registro-avances.
 * Las vistas comparten la plantilla compartido/vista-gestion.html.
 */
@Directive()
export abstract class VistaGestionBase implements OnInit, OnDestroy {
  @Input() rol!: string;

  protected readonly fb = inject(FormBuilder);
  protected readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);
  protected readonly dialog = inject(MatDialog);
  protected readonly planAuditoriaMid = inject(PlanAnualAuditoriaMid);
  protected readonly alertaService = inject(AlertService);
  private readonly parametrosUtilsService = inject(ParametrosUtilsService);
  private readonly userService = inject(UserService);
  private readonly descargaService = inject(DescargaService);

  // ── Configuración de cada vista ───────────────────────────
  abstract readonly textos: TextosVistaGestion;
  /** Ruta del MID sin parámetros; la del resumen agrega /resumen. */
  protected abstract get rutaBase(): string;
  abstract botonDe(fila: AccionGestion): BotonFila;

  readonly indicadores = indicadoresGestion;
  readonly chips = chipsGrupo;
  readonly columnasIds: string[] = columnasGestion.map((c) => c.columnDef);
  readonly columnas = columnasGestion;
  readonly pluralSoportes = pluralSoportes;
  readonly tiposEvaluacion = [
    { Id: environment.TIPO_EVALUACION.AUDITORIA_INTERNA_ID, Nombre: "Auditoría Interna" },
  ];

  filtrosForm!: FormGroup;
  vigencias: Vigencia[] = [];
  resumen: ResumenGestionAcciones | null = null;
  dataSource = new MatTableDataSource<FilaVista>([]);

  // Paginación server-side
  totalRegistros = 0;
  pageSize = 25;
  pageIndex = 0;
  readonly pageSizeOptions = [10, 25, 50];

  protected personaId = 0;
  protected readonly _onDestroy = new Subject<void>();
  private readonly consultaResumen$ = new Subject<string>();
  private readonly consultaAcciones$ = new Subject<string>();
  /** Planes a los que ya se pidió numerar acciones; evita repetir la petición al paginar o filtrar. */
  private readonly planesNumerados = new Set<string>();

  async ngOnInit(): Promise<void> {
    this.iniciarForm();
    this.escucharConsultas();
    this.personaId = await this.userService.getPersonaId().catch(() => 0);
    this.cargarVigencias();
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  get nombreVigencia(): string {
    return this.vigencias.find((v) => v.Id === this.filtrosForm?.value.vigencia)?.Nombre ?? "";
  }

  private iniciarForm(): void {
    this.filtrosForm = this.fb.group({
      vigencia:       [null],
      tipoEvaluacion: [environment.TIPO_EVALUACION.AUDITORIA_INTERNA_ID],
      noAuditoria:    [""],
      accionHallazgo: [""],
      dependencia:    [""],
      auditor:        [""],
      desde:          [null],
      hasta:          [null],
      grupo:          ["TODOS" as FiltroGrupo],
    });
  }

  /** switchMap descarta la respuesta anterior si los filtros cambian antes de que llegue. */
  private escucharConsultas(): void {
    this.consultaResumen$
      .pipe(switchMap((url) => this.consultar(url)), takeUntil(this._onDestroy))
      .subscribe(({ ok, res }) => { this.resumen = ok ? (res?.Data ?? null) : null; });

    this.consultaAcciones$
      .pipe(switchMap((url) => this.consultar(url)), takeUntil(this._onDestroy))
      .subscribe(({ ok, res }) => {
        if (!ok) {
          this.dataSource.data = [];
          this.totalRegistros = 0;
          this.alertaService.showErrorAlert("Ocurrió un error al consultar las acciones. Por favor, intente nuevamente.");
          return;
        }
        this.dataSource.data = (res?.Data ?? []).map((a: AccionGestion) => this.mapearFila(a));
        this.totalRegistros = res?.MetaData?.Count ?? this.dataSource.data.length;
        this.numerarAccionesSinNumero();
      });
  }

  /**
   * Planes aprobados antes de existir la numeración llegan sin no_accion: se pide al MID
   * numerar cada plan (una vez por plan) y se actualizan las filas visibles sin recargar.
   * Un fallo no interrumpe la vista; la fila sigue sin número.
   */
  private numerarAccionesSinNumero(): void {
    const planes = [...new Set(
      this.dataSource.data
        .filter((f) => !f.no_accion?.trim() && f.plan_mejoramiento_id)
        .map((f) => f.plan_mejoramiento_id),
    )].filter((id) => !this.planesNumerados.has(id));
    if (!planes.length) return;

    planes.forEach((id) => this.planesNumerados.add(id));
    forkJoin(planes.map((id) =>
      this.planAuditoriaMid.post(`plan-mejoramiento/${id}/numerar-acciones`, {}).pipe(
        map((res: any) => (res?.acciones ?? []) as { accionId: string; no_accion: string }[]),
        catchError(() => of([])),
      ),
    ))
      .pipe(takeUntil(this._onDestroy))
      .subscribe((resultados) => {
        const numeros = new Map(resultados.flat().map((n) => [n.accionId, n.no_accion]));
        if (!numeros.size) return;
        this.dataSource.data = this.dataSource.data.map((f) =>
          numeros.has(f.accion_id) ? { ...f, no_accion: numeros.get(f.accion_id)! } : f,
        );
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

  private mapearFila(accion: AccionGestion): FilaVista {
    return {
      ...accion,
      boton: this.botonDe(accion),
      vencimiento: textoVencimiento(accion),
      estado: estadoPorGrupo[accion.grupo],
    };
  }

  // ── Filtros ───────────────────────────────────────────────
  /** Cambio de vigencia o tipo de evaluación: recarga indicadores y tabla. */
  recargar(): void {
    this.pageIndex = 0;
    this.cargarResumen();
    this.cargarAcciones();
  }

  /** Botón "Aplicar filtros" y Enter: los campos de texto y fecha no se aplican al escribir. */
  aplicarFiltros(): void {
    const { desde, hasta } = this.filtrosForm.value;
    if (desde && hasta && hasta < desde) {
      this.alertaService.showAlert("Rango inválido", "La fecha final debe ser igual o posterior a la fecha inicial.");
      return;
    }
    this.pageIndex = 0;
    this.cargarAcciones();
  }

  seleccionarGrupo(grupo: FiltroGrupo): void {
    this.filtrosForm.patchValue({ grupo });
    this.aplicarFiltros();
  }

  /** Conserva la vigencia y el tipo de evaluación. */
  limpiarFiltros(): void {
    this.filtrosForm.patchValue({
      noAuditoria: "", accionHallazgo: "", dependencia: "", auditor: "",
      desde: null, hasta: null, grupo: "TODOS",
    });
    this.aplicarFiltros();
  }

  manejarCambioPaginado(evento: PageEvent): void {
    this.pageIndex = evento.pageIndex;
    this.pageSize = evento.pageSize;
    this.cargarAcciones();
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

  private cargarAcciones(): void {
    const params = this.construirParams(this.pageSize, this.pageIndex * this.pageSize);
    this.consultaAcciones$.next(`${this.rutaBase}?${params}`);
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

    if (v.grupo && v.grupo !== "TODOS") params.set("grupo", v.grupo);

    const textos: Record<string, string> = {
      no_auditoria:    v.noAuditoria,
      accion_hallazgo: v.accionHallazgo,
      dependencia:     v.dependencia,
      auditor:         v.auditor,
    };
    for (const [clave, valor] of Object.entries(textos)) {
      if (valor?.trim()) params.set(clave, valor.trim());
    }

    if (v.desde) params.set("desde", format(v.desde, "yyyy-MM-dd"));
    if (v.hasta) params.set("hasta", format(v.hasta, "yyyy-MM-dd"));

    return params;
  }

  // ── Acciones por fila ─────────────────────────────────────
  abrirAccion(fila: AccionGestion): void {
    this.router.navigate(["registrar-avances", fila.accion_id], { relativeTo: this.route });
  }

  verHistorial(fila: AccionGestion): void {
    this.dialog.open(ModalHistorialRechazosComponent, {
      width: "1000px",
      autoFocus: false,
      data: {
        auditoriaId: fila.accion_id,
        estadoEndpoint: "calificacion-accion",
        auditoriaIdReferencia: "accion_mejora_id",
        titulo: "Historial de la acción",
        descripcion: `Historial de la acción ${fila.no_accion}`,
      } as HistorialRechazosData,
    });
  }

  // ── Exportar ──────────────────────────────────────────────
  exportarTabla(): void {
    const params = this.construirParams(0, 0);

    this.planAuditoriaMid.get(`${this.rutaBase}?${params}`).subscribe({
      next: (res) => {
        const acciones: AccionGestion[] = res?.Data ?? [];
        if (!acciones.length) {
          this.alertaService.showAlert("Sin resultados", "No hay acciones para exportar con los filtros aplicados.");
          return;
        }

        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(acciones.map(filaExportacion)), "Acciones");
        const buffer: ArrayBuffer = XLSX.write(libro, { bookType: "xlsx", type: "array" });
        this.descargaService.descargarArchivoBuffer(buffer, MIME_XLSX, `${this.textos.nombreExportacion}_${this.nombreVigencia}`);
      },
      error: () => this.alertaService.showErrorAlert("No fue posible exportar la tabla."),
    });
  }
}
