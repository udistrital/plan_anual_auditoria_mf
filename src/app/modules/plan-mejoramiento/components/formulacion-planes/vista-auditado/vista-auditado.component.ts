import { Component, Input, OnDestroy, OnInit, TemplateRef } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { PageEvent } from "@angular/material/paginator";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, takeUntil } from "rxjs/operators";
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
import type {
  AuditoriaFormulacionPlan,
  ResumenFormulacionPlanes,
} from "src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models";
import {
  GrupoEstadoPlan,
  accionesHabilitadas,
  claseChipPorGrupo,
  columnasFormulacion,
  descripcionFlujoPlan,
  estadosDeGrupo,
  grupoDeEstado,
  iconosAccion,
  indicadoresFormulacion,
  opcionesEstadoPlan,
  pasosFlujoPlan,
  pluralHallazgos,
  pluralObservaciones,
} from "./vista-auditado.utilidades";

export interface FilaFormulacion extends AuditoriaFormulacionPlan {
  claseEstado: string;
  acciones: string[];
  mostrarObservaciones: boolean;
}

const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

@Component({
  selector: "app-formulacion-vista-auditado",
  templateUrl: "./vista-auditado.component.html",
  styleUrls: ["./vista-auditado.component.css"],
  standalone: false,
})
export class VistaAuditadoComponent implements OnInit, OnDestroy {
  /** Rol del auditado (JEFE_DEPENDENCIA o ASISTENTE_DEPENDENCIA). */
  @Input() rol!: string;

  filtrosForm!: FormGroup;
  vigencias: Vigencia[] = [];
  readonly tiposEvaluacion = [
    { Id: environment.TIPO_EVALUACION.AUDITORIA_INTERNA_ID, Nombre: "Auditoría Interna" },
  ];

  readonly opcionesEstadoPlan = opcionesEstadoPlan;
  readonly indicadores = indicadoresFormulacion;
  readonly columnas = columnasFormulacion;
  readonly columnasIds = columnasFormulacion.map((c) => c.columnDef);
  readonly pasosFlujo = pasosFlujoPlan;
  readonly descripcionFlujo = descripcionFlujoPlan;
  readonly pluralHallazgos = pluralHallazgos;
  readonly pluralObservaciones = pluralObservaciones;

  resumen: ResumenFormulacionPlanes | null = null;
  dataSource = new MatTableDataSource<FilaFormulacion>([]);

  // Paginación server-side
  totalRegistros = 0;
  pageSize = 10;
  pageIndex = 0;
  readonly pageSizeOptions = [5, 10, 25, 50];

  private personaId = 0;
  private cargoId = 0;
  private readonly _onDestroy = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly parametrosUtilsService: ParametrosUtilsService,
    private readonly userService: UserService,
    private readonly alertaService: AlertService,
    private readonly descargaService: DescargaService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.cargoId = this.rol === environment.ROL.JEFE_DEPENDENCIA
      ? environment.CARGO.JEFE_DEPENDENCIA_ID
      : environment.CARGO.ASISTENTE_DEPENDENCIA_ID;
    this.iniciarForm();
    this.escucharBusqueda();
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
      grupoEstado:    ["TODOS" as GrupoEstadoPlan],
    });
  }

  private escucharBusqueda(): void {
    this.filtrosForm.get("busqueda")!.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this._onDestroy))
      .subscribe(() => this.aplicarFiltros());
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

  seleccionarGrupo(grupo: GrupoEstadoPlan): void {
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
  private get rutaBase(): string {
    return `plan-mejoramiento/formulacion/auditado/${this.personaId}/${this.cargoId}`;
  }

  private cargarResumen(): void {
    const { vigencia, tipoEvaluacion } = this.filtrosForm.value;
    const params = new URLSearchParams({ vigencia_id: String(vigencia), tipo_evaluacion_id: String(tipoEvaluacion) });

    this.planAuditoriaMid.get(`${this.rutaBase}/resumen?${params}`).subscribe({
      next: (res) => { this.resumen = res?.Data ?? null; },
      error: () => { this.resumen = null; },
    });
  }

  private cargarAuditorias(): void {
    const params = this.construirParams(this.pageSize, this.pageIndex * this.pageSize);

    this.planAuditoriaMid.get(`${this.rutaBase}?${params}`).subscribe({
      next: (res) => {
        this.dataSource.data = (res?.Data ?? []).map((a: AuditoriaFormulacionPlan) => this.mapearFila(a));
        this.totalRegistros = res?.MetaData?.Count ?? this.dataSource.data.length;
      },
      error: () => {
        this.dataSource.data = [];
        this.totalRegistros = 0;
        this.alertaService.showErrorAlert("Ocurrió un error al consultar las auditorías. Por favor, intente nuevamente.");
      },
    });
  }

  private construirParams(limit: number, offset: number): URLSearchParams {
    const v = this.filtrosForm.value;
    const params = new URLSearchParams({
      vigencia_id:        String(v.vigencia),
      tipo_evaluacion_id: String(v.tipoEvaluacion),
      limit:              String(limit),
      offset:             String(offset),
    });

    const estados = estadosDeGrupo(v.grupoEstado);
    if (estados.length)     params.set("estado_ids", estados.join(","));
    if (v.busqueda?.trim()) params.set("busqueda", v.busqueda.trim());

    return params;
  }

  private mapearFila(auditoria: AuditoriaFormulacionPlan): FilaFormulacion {
    const estadoId = auditoria.estado_plan_id;
    return {
      ...auditoria,
      claseEstado: claseChipPorGrupo[grupoDeEstado(estadoId)],
      acciones: (accionesPlanMejoramiento[this.rol]?.[estadoId] ?? []).filter((a) => accionesHabilitadas.includes(a)),
      mostrarObservaciones:
        estadoId === environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.RECHAZADO_PLAN_MEJORAMIENTO &&
        auditoria.total_observaciones > 0,
    };
  }

  abrirFlujo(modalFlujo: TemplateRef<unknown>): void {
    this.dialog.open(modalFlujo, {
      width: "900px",
      maxWidth: "95vw",
      ariaLabel: "Flujo Institucional del Plan de Mejoramiento",
      panelClass: "modal-flujo-plan",
    });
  }

  // ── Acciones por fila ─────────────────────────────────────
  getIconoAccion(accion: string): string {
    return iconosAccion.get(accion) ?? "help_outline";
  }

  realizarAccion(fila: FilaFormulacion, accion: string): void {
    const acciones: Record<string, () => void> = {
      "Registrar Plan":    () => this.router.navigate([`/plan-mejoramiento/registrar-plan/${fila.auditoria_id}`]),
      "Ver Plan":          () => this.router.navigate([`/plan-mejoramiento/ver-plan/${fila.auditoria_id}`]),
      "Ver Observaciones": () => this.verObservaciones(fila),
    };
    acciones[accion]?.();
  }

  private verObservaciones(fila: FilaFormulacion): void {
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
  exportarTabla(): void {
    const params = this.construirParams(0, 0);

    this.planAuditoriaMid.get(`${this.rutaBase}?${params}`).subscribe({
      next: (res) => {
        const auditorias: AuditoriaFormulacionPlan[] = res?.Data ?? [];
        if (!auditorias.length) {
          this.alertaService.showAlert("Sin resultados", "No hay auditorías para exportar con los filtros aplicados.");
          return;
        }

        const columnasExportables = this.columnas.filter((c) => c.columnDef !== "acciones");
        const filas = auditorias.map((a) => ({
          ...Object.fromEntries(columnasExportables.map((c) => [c.header, c.cell(a)])),
          "Hallazgos": a.total_hallazgos,
          "Observaciones del Auditor": a.total_observaciones,
        }));

        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(filas), "Auditorías");
        const buffer: ArrayBuffer = XLSX.write(libro, { bookType: "xlsx", type: "array" });
        const vigencia = this.vigencias.find((v) => v.Id === this.filtrosForm.value.vigencia)?.Nombre ?? "";
        this.descargaService.descargarArchivoBuffer(buffer, MIME_XLSX, `Formulacion_Planes_${vigencia}`);
      },
      error: () => this.alertaService.showErrorAlert("No fue posible exportar la tabla."),
    });
  }
}
