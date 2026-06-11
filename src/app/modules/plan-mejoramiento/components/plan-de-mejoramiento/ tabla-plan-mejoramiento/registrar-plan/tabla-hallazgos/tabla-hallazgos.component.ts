import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { DescargaService } from 'src/app/shared/services/descarga.service';
import { RolService } from 'src/app/core/services/rol.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';
import { ModalRegistrarAccionComponent } from '../modal-registrar-accion/modal-registrar-accion.component';
import { Auditoria } from 'src/app/shared/data/models/auditoria';
import { ModalObservacionAccionComponent } from '../modal-observacion-accion/modal-observacion-accion.component';
import { ModalHistorialObservacionesAccionComponent } from '../modal-historial-observaciones-accion/modal-historial-observaciones-accion.component';

export interface HallazgoTabla {
  hallazgoId: string;
  indice: string;
  descripcion: string;
  causa: string;
  acciones: AccionPlan[];
  expandido: boolean;
}

export interface AccionPlan {
  accionId?: string;
  numero: string;
  tipoAccion: string;
  tipoAccionId?: number;
  accionPlanteada: string;
  nombreIndicador: string;
  formulaIndicador: string;
  meta: string;
  responsable: string;
  fechaInicio: string;
  fechaFin: string;
  fechaInicioISO: string | null;
  fechaFinISO: string | null;
  estadoId: number;
  estadoNombre: string;
}

export interface ResultadoModalAccion {
  accion: {
    tipoAccionId: number;
    accionPlanteada: string;
    nombreIndicador: string;
    formulaIndicador: string;
    meta: string;
    accionId?: string;
    fechaInicio?: string | null;
    fechaFin?: string | null;
  };
  responsablesNuevos: { dependencia_id: number; dependencia_lider: boolean }[];
  responsablesAEliminar: string[];
}

export interface FilaTabla {
  esGrupo: boolean;
  hallazgoId: string;
  hallazgoIndice: string;
  hallazgoDescripcion: string;
  hallazgoCausa: string;
  accion?: AccionPlan;
}

const TIPO_NOMBRES: Record<number, string> = { 1: 'Preventiva', 2: 'Correctiva' };

const ESTADO_ACCION = environment.ACCION_MEJORA_ESTADOS;

@Component({
    selector: 'app-tabla-hallazgos',
    templateUrl: './tabla-hallazgos.component.html',
    styleUrls: ['./tabla-hallazgos.component.css'],
    standalone: false
})
export class TablaHallazgosComponent implements OnInit {
  @Input() auditoriaId!: string;
  @Input() planMejoramientoId!: string;
  @Input() auditoria!: Auditoria;
  @Input() soloLectura = false;
  // Modo revisión del auditor: habilita aprobar/rechazar cada acción
  @Input() modoRevision = false;

  // Notifica al contenedor (VerPlan) que cambió el estado de alguna acción
  @Output() estadoAccionCambiado = new EventEmitter<void>();

  readonly ESTADO_ACCION = ESTADO_ACCION;

  usuarioId = 0;
  role: string | null = null;

  fechaAprobacionInforme: string | null = null;
  hallazgos: HallazgoTabla[] = [];
  filas: FilaTabla[] = [];
  cargando = true;

  private readonly columnasTodas = [
    'noHallazgo', 'descripcion', 'causa', 'numero', 'tipoAccion',
    'accionPlanteada', 'nombreIndicador', 'formulaIndicador',
    'meta', 'responsable', 'fechaInicio', 'fechaFin', 'estado', 'acciones',
  ];

  get columnas(): string[] {
    const base = this.columnasTodas.filter(c => c !== 'acciones');
    if (this.modoRevision) return [...base, 'revision'];
    if (this.soloLectura) return base;
    return this.columnasTodas;
  }

  esFilaGrupo  = (_i: number, fila: FilaTabla) =>  fila.esGrupo;
  esFilaAccion = (_i: number, fila: FilaTabla) => !fila.esGrupo;

  constructor(
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly alertService: AlertService,
    private readonly dialog: MatDialog,
    private readonly descargaService: DescargaService,
    private readonly rolService: RolService,
    private readonly userService: UserService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.role = this.rolService.getRolPrioritario([
      environment.ROL.JEFE,
      environment.ROL.AUDITOR_EXPERTO,
      environment.ROL.AUDITOR,
      environment.ROL.AUDITOR_ASISTENTE,
      environment.ROL.JEFE_DEPENDENCIA,
      environment.ROL.ASISTENTE_DEPENDENCIA,
    ]);
    this.usuarioId = await this.userService.getPersonaId();
    this.cargarDatos();
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  getHallazgo(hallazgoId: string): HallazgoTabla | undefined {
    return this.hallazgos.find(h => h.hallazgoId === hallazgoId);
  }

  private reconstruirFilas(): void {
    const filas: FilaTabla[] = [];

    this.hallazgos.forEach(h => {
      filas.push({
        esGrupo:             true,
        hallazgoId:          h.hallazgoId,
        hallazgoIndice:      h.indice,
        hallazgoDescripcion: h.descripcion,
        hallazgoCausa:       h.causa,
      });

      if (h.expandido && h.acciones.length > 0) {
        h.acciones.forEach(accion => {
          filas.push({
            esGrupo:             false,
            hallazgoId:          h.hallazgoId,
            hallazgoIndice:      h.indice,
            hallazgoDescripcion: h.descripcion,
            hallazgoCausa:       h.causa,
            accion,
          });
        });
      }
    });

    this.filas = filas;
  }

  private mapearAccion(a: any, index: number, responsablesPorAccion?: Map<string, string[]>): AccionPlan {
    const nombres = responsablesPorAccion?.get(a._id) ?? [];
    const estadoId = a.estado_id ?? ESTADO_ACCION.PENDIENTE_REVISION;
    return {
      accionId:         a._id,
      numero:           String(index + 1),
      tipoAccionId:     a.tipo_id ?? 1,
      tipoAccion:       TIPO_NOMBRES[a.tipo_id] ?? '',
      accionPlanteada:  a.descripcion ?? '',
      nombreIndicador:  a.nombre_indicador ?? '',
      formulaIndicador: a.formula_indicador ?? '',
      meta:             a.meta ?? '',
      responsable:      nombres.join(', '),
      fechaInicio:      this.formatearFecha(a.fecha_inicio),
      fechaFin:         this.formatearFecha(a.fecha_fin),
      fechaInicioISO:   a.fecha_inicio ?? null,
      fechaFinISO:      a.fecha_fin ?? null,
      estadoId,
      estadoNombre:     a.estado_nombre ?? '',
    };
  }

  private formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CO');
  }

  // ─── Carga de datos ──────────────────────────────────────────────────────────

  cargarDatos(): void {
    this.cargando = true;
    const estadoPrevio = new Map<string, boolean>();
    this.hallazgos.forEach(h => estadoPrevio.set(h.hallazgoId, h.expandido));

    this.planAuditoriaService
      .get(`informe?query=auditoria_id:${this.auditoriaId},activo:true`)
      .pipe(
        switchMap((resInforme) => {
          if (!resInforme.Data?.length) {
            return of({ hallazgos: { Data: [] }, acciones: { Data: [] }, responsables: { Data: [] } });
          }
          const informe = resInforme.Data[0];
          this.fechaAprobacionInforme = informe.fecha_aprobacion_informe ?? null;
          const informeId = informe._id;
          return forkJoin({
            hallazgos: this.planAuditoriaService
              .get(`hallazgo?query=informe_id:${informeId},activo:true`),
            acciones: this.planAuditoriaMid
              .get(`accion-mejora?query=plan_mejoramiento_id:${this.planMejoramientoId},activo:true`)
              .pipe(catchError(() => of({ Data: [] }))),
          }).pipe(
            switchMap(({ hallazgos, acciones }) => {
              const accionIds: string[] = (acciones.Data ?? []).map((a: any) => a._id).filter(Boolean);
              const responsables$ = accionIds.length
                ? this.planAuditoriaMid
                    .get(`responsable-accion?query=accion_mejora_id__in:${accionIds.join('|')},activo:true&limit=0`)
                    .pipe(catchError(() => of({ Data: [] })))
                : of({ Data: [] });
              return forkJoin({ hallazgos: of(hallazgos), acciones: of(acciones), responsables: responsables$ });
            })
          );
        })
      )
      .subscribe({
        next: ({ hallazgos, acciones, responsables }) => {
          const accionesData: any[] = acciones.Data ?? [];

          const responsablesPorAccion = new Map<string, string[]>();
          (responsables.Data ?? []).forEach((r: any) => {
            const accionId = typeof r.accion_mejora_id === 'object'
              ? r.accion_mejora_id?._id
              : r.accion_mejora_id;
            if (!accionId || !r.dependencia_nombre) return;
            const lista = responsablesPorAccion.get(accionId) ?? [];
            lista.push(r.dependencia_nombre);
            responsablesPorAccion.set(accionId, lista);
          });

          const accionesPorHallazgo = new Map<string, any[]>();
          accionesData.forEach((a: any) => {
            const key = typeof a.hallazgo_id === 'object'
              ? a.hallazgo_id?._id
              : a.hallazgo_id;
            if (!key) return;
            const lista = accionesPorHallazgo.get(key) ?? [];
            lista.push(a);
            accionesPorHallazgo.set(key, lista);
          });

          this.hallazgos = (hallazgos.Data ?? [])
            .filter((h: any) => h.activo !== false)
            .map((h: any, i: number) => ({
              hallazgoId:  h._id,
              indice:      h.no_hallazgo ?? String(i + 1),
              descripcion: h.descripcion ?? h.titulo ?? '',
              causa:       h.criterio ?? '',
              expandido:   estadoPrevio.get(h._id) ?? false,
              acciones:    (accionesPorHallazgo.get(h._id) ?? [])
                             .map((a: any, j: number) => this.mapearAccion(a, j, responsablesPorAccion)),
            }));

          this.reconstruirFilas();
          this.cargando = false;
        },
        error: () => { this.cargando = false; }
      });
  }

  // ─── Expansión ───────────────────────────────────────────────────────────────

  toggleHallazgo(hallazgoId: string): void {
    const h = this.getHallazgo(hallazgoId);
    if (!h) return;
    h.expandido = !h.expandido;
    this.reconstruirFilas();
  }

  // ─── Modal ───────────────────────────────────────────────────────────────────

  abrirModalRegistrarAccion(hallazgo: HallazgoTabla | undefined, accion?: AccionPlan): void {
    if (!hallazgo) return;

    const dialogRef = this.dialog.open(ModalRegistrarAccionComponent, {
      width: '1000px',
      data: {
        hallazgo,
        accion: accion ?? null,
        auditoria: this.auditoria,
        planMejoramientoId: this.planMejoramientoId,
        fechaAprobacionInforme: this.fechaAprobacionInforme,
      },
    });

    dialogRef.afterClosed().subscribe((resultado: ResultadoModalAccion | null) => {
      if (!resultado) return;
      accion ? this.actualizarAccion(resultado, accion) : this.crearAccion(resultado, hallazgo);
    });
  }

  // ─── Persistencia ────────────────────────────────────────────────────────────

  private crearAccion(resultado: ResultadoModalAccion, hallazgo: HallazgoTabla): void {
    const body = {
      plan_mejoramiento_id: this.planMejoramientoId,
      hallazgo_id:          hallazgo.hallazgoId,
      descripcion:          resultado.accion.accionPlanteada,
      tipo_id:              resultado.accion.tipoAccionId,
      nombre_indicador:     resultado.accion.nombreIndicador,
      formula_indicador:    resultado.accion.formulaIndicador,
      meta:                 resultado.accion.meta,
      fecha_inicio:         resultado.accion.fechaInicio,
      fecha_fin:            resultado.accion.fechaFin,
      estado_id:            ESTADO_ACCION.PENDIENTE_REVISION,
      creado_por_id:        this.usuarioId,
      creado_por_rol:       this.role,
      activo:               true,
    };

    this.planAuditoriaService.post('accion-mejora', body).subscribe({
      next: (res: any) => {
        const accionId = res.Data._id;
        this.guardarResponsables(accionId, resultado.responsablesNuevos, () => {
          this.registrarEstadoAccion(
            accionId,
            ESTADO_ACCION.PENDIENTE_REVISION,
            null,
            () => {
              hallazgo.expandido = true;
              this.cargarDatos();
            }
          );
        });
      },
      error: () => this.alertService.showErrorAlert('Error al guardar la acción de mejora.'),
    });
  }

  private actualizarAccion(resultado: ResultadoModalAccion, accionAnterior: AccionPlan): void {
    const body = {
      descripcion:       resultado.accion.accionPlanteada,
      tipo_id:           resultado.accion.tipoAccionId,
      nombre_indicador:  resultado.accion.nombreIndicador,
      formula_indicador: resultado.accion.formulaIndicador,
      meta:              resultado.accion.meta,
      fecha_inicio:      resultado.accion.fechaInicio,
      fecha_fin:         resultado.accion.fechaFin,
      modificado_por_id:  this.usuarioId,
      modificado_por_rol: this.role,
    };

    // Si la acción venía RECHAZADA, al corregirla vuelve a PENDIENTE_REVISION
    const veniaRechazada = accionAnterior.estadoId === ESTADO_ACCION.RECHAZADA;

    this.planAuditoriaService
      .put(`accion-mejora/${accionAnterior.accionId}`, body as any)
      .subscribe({
        next: () => {
          this.sincronizarResponsables(
            accionAnterior.accionId!,
            resultado.responsablesNuevos,
            resultado.responsablesAEliminar,
            () => {
              if (veniaRechazada) {
                this.registrarEstadoAccion(
                  accionAnterior.accionId!,
                  ESTADO_ACCION.PENDIENTE_REVISION,
                  null,
                  () => this.cargarDatos()
                );
              } else {
                this.cargarDatos();
              }
            }
          );
        },
        error: () => this.alertService.showErrorAlert('Error al actualizar la acción de mejora.'),
      });
  }

  // ─── Revisión del auditor (aprobar / rechazar por acción) ─────────────────────

  aprobarAccion(accion: AccionPlan | undefined): void {
    if (!accion?.accionId) return;
    const dialogRef = this.dialog.open(ModalObservacionAccionComponent, {
      width: '600px',
      data: {
        accionPlanteada: accion.accionPlanteada,
        titulo:      'Aprobar Acción de Mejora',
        descripcion: 'Registre la observación de la aprobación',
        etiqueta:    'Observación de la aprobación',
        textoBoton:  'Aprobar',
        icono:       'check_circle',
        confirmMsg:  '¿Aprobar esta acción de mejora?',
      },
    });

    dialogRef.afterClosed().subscribe((observacion: string | null) => {
      if (!observacion) return;
      this.registrarEstadoAccion(
        accion.accionId!,
        ESTADO_ACCION.APROBADA,
        observacion,
        () => {
          this.alertService.showSuccessAlert('Acción aprobada con observación.', 'Aprobada');
          this.estadoAccionCambiado.emit();
          this.cargarDatos();
        }
      );
    });
  }

  rechazarAccion(accion: AccionPlan | undefined): void {
    if (!accion?.accionId) return;
    const dialogRef = this.dialog.open(ModalObservacionAccionComponent, {
      width: '600px',
      data: { accionPlanteada: accion.accionPlanteada },
    });

    dialogRef.afterClosed().subscribe((observacion: string | null) => {
      if (!observacion) return;
      this.registrarEstadoAccion(
        accion.accionId!,
        ESTADO_ACCION.RECHAZADA,
        observacion,
        () => {
          this.alertService.showSuccessAlert('Acción rechazada con observación.', 'Rechazada');
          this.estadoAccionCambiado.emit();
          this.cargarDatos();
        }
      );
    });
  }

  verHistorialAccion(accion: AccionPlan | undefined): void {
    if (!accion?.accionId) return;
    this.dialog.open(ModalHistorialObservacionesAccionComponent, {
      width: '900px',
      data: { accionMejoraId: accion.accionId, accionPlanteada: accion.accionPlanteada },
    });
  }

  private registrarEstadoAccion(
    accionId: string,
    estadoId: number,
    observacion: string | null,
    callback: () => void
  ): void {
    const body = {
      accion_mejora_id:       accionId,
      usuario_id:             this.usuarioId,
      usuario_rol:            this.role,
      observacion,
      estado_id:              estadoId,
      fecha_ejecucion_estado: new Date().toISOString(),
      activo:                 true,
    };

    this.planAuditoriaService.post('accion-mejora-estado', body).subscribe({
      next: () => callback(),
      error: () => this.alertService.showErrorAlert('Error al registrar el estado de la acción.'),
    });
  }

  eliminarAccion(hallazgo: HallazgoTabla | undefined, accion: AccionPlan | undefined): void {
    if (!hallazgo || !accion?.accionId) return;

    this.alertService.showConfirmAlert('¿Eliminar esta acción de mejora?').then(conf => {
      if (!conf.value) return;

      this.planAuditoriaService.delete('accion-mejora', { id: accion.accionId }).subscribe({
        next: () => this.cargarDatos(),
        error: () => this.alertService.showErrorAlert('Error al eliminar la acción.'),
      });
    });
  }

  // ─── Responsables ────────────────────────────────────────────────────────────

  private guardarResponsables(
    accionId: string,
    responsables: { dependencia_id: number; dependencia_lider: boolean }[],
    callback: () => void
  ): void {
    if (!responsables.length) { callback(); return; }

    // catchError individual: un fallo no cancela el resto del forkJoin
    const requests = responsables.map(r =>
      this.planAuditoriaService.post('responsable-accion', {
        accion_mejora_id:  accionId,
        dependencia_id:    r.dependencia_id,
        dependencia_lider: r.dependencia_lider,
        activo:            true,
      }).pipe(catchError(err => { console.error('Error responsable:', err); return of(null); }))
    );

    forkJoin(requests).subscribe({ next: () => callback(), error: () => callback() });
  }

  exportarTabla() {
    const headers = [
        "No. Hallazgo",
        "Descripción del Hallazgo",
        "Causa del Hallazgo",
        "No. Acción",
        "Tipo de Acción",
        "Acción Planteada",
        "Nombre del Indicador",
        "Fórmula del Indicador",
        "Meta",
        "Responsable de la Acción",
        "Fecha Inicio",
        "Fecha Fin"
      ];

    const rows = this.hallazgos.map(
        hallazgo => hallazgo.acciones.map(
          accion => [
            hallazgo.indice,
            hallazgo.descripcion,
            hallazgo.causa,
            accion.numero,
            accion.tipoAccion,
            accion.accionPlanteada,
            accion.nombreIndicador,
            accion.formulaIndicador,
            accion.meta,
            accion.responsable,
            accion.fechaInicio,
            accion.fechaFin,
          ]
        ).concat()
      );

    const payload = {
        worksheets: [{
          name: "Acciones de mejora",
          rows: [headers, ...rows.flat()]
        }]
      };

    const consecutivoOCI = this.auditoria.consecutivo_OCI ?? 'sin_consecutivo';
    const tipoEvaluacion = this.auditoria.tipo_evaluacion_nombre?.toLowerCase().replace(/\s+/g, '_') ?? 'sin_tipo';

    this.planAuditoriaMid.post(
        'cargue-masivo/exportar-excel',
        payload
      ).subscribe({
        next: (res: any) => {
          this.descargaService.descargarArchivo(
            res.base64,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            `acciones_mejora_${tipoEvaluacion}_${consecutivoOCI}`
          );
        },
        error: (err) => {
          console.error('Error exportar tabla:', err);
          this.alertService.showErrorAlert('Error al exportar la tabla.');
        }
      });
  }

  private sincronizarResponsables(
    accionId: string,
    nuevos: { dependencia_id: number; dependencia_lider: boolean }[],
    aEliminar: string[],
    callback: () => void
  ): void {
    const creaciones = nuevos.map(r =>
      this.planAuditoriaService.post('responsable-accion', {
        accion_mejora_id:  accionId,
        dependencia_id:    r.dependencia_id,
        dependencia_lider: r.dependencia_lider,
        activo:            true,
      }).pipe(catchError(err => { console.error('Error responsable:', err); return of(null); }))
    );

    const eliminaciones = aEliminar.map(id =>
      this.planAuditoriaService
        .delete('responsable-accion', { id })
        .pipe(catchError(err => { console.error('Error eliminar responsable:', err); return of(null); }))
    );

    const todas = [...creaciones, ...eliminaciones];
    if (!todas.length) { callback(); return; }

    forkJoin(todas).subscribe({ next: () => callback(), error: () => callback() });
  }
}
