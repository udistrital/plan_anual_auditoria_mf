import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { catchError, firstValueFrom, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { DescargaService } from 'src/app/shared/services/descarga.service';
import { RolService } from 'src/app/core/services/rol.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';
import { ModalRegistrarAccionComponent } from '../modal-registrar-accion/modal-registrar-accion.component';
import { ModalRemitirHallazgoComponent, ResultadoModalRemitirHallazgo } from '../modal-remitir-hallazgo/modal-remitir-hallazgo.component';
import { HistorialRechazosData, ModalHistorialRechazosComponent } from 'src/app/shared/elements/components/dialogs/modal-historial-rechazos/modal-historial-rechazos.component';
import { columnasVistaDictamen, hallazgosConstructorTabla, iconosAccionHallazgo, iconosUtilidadHallazgo } from './tabla-hallazgos.utilidades';
import { Auditoria } from 'src/app/shared/data/models/auditoria';
import { DatosModalObservacionAccion, ModalObservacionAccionComponent, ResultadoDictamenAccion } from '../modal-observacion-accion/modal-observacion-accion.component';
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
  /** Responsables con su rol (líder / apoyo); se usa en el modal de dictamen */
  responsables?: { nombre: string; lider: boolean }[];
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
  // Modo revisión del auditor: habilita dictaminar (aprobar/rechazar) cada acción
  @Input() modoRevision = false;
  // Vista de Ver Plan: columnas de dictamen y resumen por hallazgo (con o sin modoRevision)
  @Input() vistaDictamen = false;

  // Notifica al contenedor que cambiaron las acciones del plan (para refrescar sus totales)
  @Output() estadoAccionCambiado = new EventEmitter<void>();

  readonly ESTADO_ACCION = ESTADO_ACCION;

  usuarioId = 0;
  role: string | null = null;

  fechaAprobacionInforme: string | null = null;
  hallazgos: HallazgoTabla[] = [];
  filas: FilaTabla[] = [];
  cargando = true;

  // Paginación server-side por hallazgo (cada página trae los hallazgos completos con sus acciones)
  readonly opcionesTamanoPagina = [5, 10, 20];
  tamanoPagina = 10;
  indicePagina = 0;
  totalHallazgos = 0;
  private informeId: string | null = null;
  /** Hallazgos expandidos/colapsados por el usuario; se conserva al cambiar de página */
  private readonly expansion = new Map<string, boolean>();

  constructorTabla = hallazgosConstructorTabla;
  columnas: string[] = [];

  readonly iconosAccion = iconosAccionHallazgo;
  readonly iconosUtilidad = iconosUtilidadHallazgo;
  readonly utilidadesHallazgo = ['Agregar Acción', 'Remitir Hallazgo', 'Histórico de Remisiones'];
  readonly accionesHallazgo = ['Editar Acción', 'Eliminar Acción'];

  esFilaGrupo  = (_i: number, fila: FilaTabla) =>  fila.esGrupo;
  esFilaAccion = (_i: number, fila: FilaTabla) => !fila.esGrupo;

  getIconoAccion(accion: string): string {
    return this.iconosAccion.get(accion) ?? 'help';
  }

  getIconoUtilidad(utilidad: string): string {
    return this.iconosUtilidad.get(utilidad) ?? 'help';
  }

  realizarAccionHallazgo(hallazgoId: string, accion: string): void {
    const hallazgo = this.getHallazgo(hallazgoId);
    const acciones: Record<string, () => void> = {
      'Agregar Acción': () => this.abrirModalRegistrarAccion(hallazgo),
      'Remitir Hallazgo': () => this.remitirHallazgo(hallazgo),
      'Histórico de Remisiones': () => this.verHistoricoRemisiones(hallazgo),
    };
    acciones[accion]?.();
  }

  private construirColumnas(): void {
    if (this.vistaDictamen) {
      this.constructorTabla = hallazgosConstructorTabla.filter(c => columnasVistaDictamen.includes(c.columnDef));
      this.columnas = [...this.constructorTabla.map(c => c.columnDef), 'estadoDictamen', 'accionOci'];
    } else {
      this.constructorTabla = hallazgosConstructorTabla.filter(
        c => c.columnDef !== 'acciones' || !this.soloLectura
      );
      this.columnas = this.constructorTabla.map(c => c.columnDef);
    }
  }

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
    this.construirColumnas();
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

  private mapearAccion(
    a: any,
    index: number,
    responsablesPorAccion?: Map<string, { nombre: string; lider: boolean }[]>
  ): AccionPlan {
    const responsables = responsablesPorAccion?.get(a._id) ?? [];
    const nombres = responsables.map(r => r.nombre);
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
      responsables,
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

  /** Carga la página actual de hallazgos con sus acciones y responsables */
  cargarDatos(): void {
    this.cargando = true;

    this.obtenerInforme()
      .pipe(switchMap(informeId => informeId
        ? this.consultarHallazgos(informeId, this.tamanoPagina, this.indicePagina * this.tamanoPagina)
        : of({ hallazgos: [] as HallazgoTabla[], total: 0 })))
      .subscribe({
        next: ({ hallazgos, total }) => {
          // Si la página quedó vacía (p. ej. tras remitir el último hallazgo), va a la última página con datos
          const ultimaPagina = Math.max(0, Math.ceil(total / this.tamanoPagina) - 1);
          if (!hallazgos.length && total > 0 && ultimaPagina < this.indicePagina) {
            this.indicePagina = ultimaPagina;
            this.cargarDatos();
            return;
          }
          this.totalHallazgos = total;
          this.hallazgos = hallazgos;
          this.reconstruirFilas();
          this.cargando = false;
        },
        error: () => { this.cargando = false; }
      });
  }

  cambiarPagina(evento: PageEvent): void {
    this.tamanoPagina = evento.pageSize;
    this.indicePagina = evento.pageIndex;
    this.cargarDatos();
  }

  /** Recarga la página tras una modificación y avisa al contenedor */
  private recargarTrasCambio(): void {
    this.cargarDatos();
    this.estadoAccionCambiado.emit();
  }

  // Informe del que salen los hallazgos (se consulta una sola vez)
  private obtenerInforme(): Observable<string | null> {
    if (this.informeId) return of(this.informeId);
    return this.planAuditoriaService
      .get(`informe?query=auditoria_id:${this.auditoriaId},activo:true`)
      .pipe(map((resInforme) => {
        const informe = resInforme.Data?.[0];
        if (!informe) return null;
        this.fechaAprobacionInforme = informe.fecha_aprobacion_informe ?? null;
        this.informeId = informe._id;
        return this.informeId;
      }));
  }

  /**
   * Consulta hallazgos (limit = 0 → todos) y, solo para ellos, sus acciones y responsables.
   * El orden por _id mantiene estable la paginación.
   */
  private consultarHallazgos(
    informeId: string,
    limit: number,
    offset: number
  ): Observable<{ hallazgos: HallazgoTabla[]; total: number }> {
    return this.planAuditoriaService
      .get(`hallazgo?query=informe_id:${informeId},activo:true&limit=${limit}&offset=${offset}&sortby=_id&order=asc`)
      .pipe(
        switchMap((resHallazgos) => {
          const hallazgosData: any[] = resHallazgos.Data ?? [];
          const total: number = resHallazgos.MetaData?.Count ?? hallazgosData.length;
          if (!hallazgosData.length) {
            return of({ hallazgosData, total, acciones: [] as any[], responsables: [] as any[] });
          }

          const filtroHallazgos = limit > 0
            ? `,hallazgo_id__in:${hallazgosData.map(h => h._id).join('|')}`
            : '';
          return this.planAuditoriaMid
            .get(`accion-mejora?query=plan_mejoramiento_id:${this.planMejoramientoId}${filtroHallazgos},activo:true&limit=0`)
            .pipe(
              catchError(() => {
                this.alertService.showErrorAlert('Error al consultar las acciones de mejora.');
                return of({ Data: [] });
              }),
              switchMap((resAcciones) => {
                const acciones: any[] = resAcciones.Data ?? [];
                const accionIds: string[] = acciones.map((a: any) => a._id).filter(Boolean);
                const responsables$ = accionIds.length
                  ? this.planAuditoriaMid
                      .get(`responsable-accion?query=accion_mejora_id__in:${accionIds.join('|')},activo:true&limit=0`)
                      .pipe(map((r: any) => r.Data ?? []), catchError(() => of([])))
                  : of([]);
                return responsables$.pipe(map((responsables: any[]) => ({ hallazgosData, total, acciones, responsables })));
              })
            );
        }),
        map(({ hallazgosData, total, acciones, responsables }) => ({
          total,
          hallazgos: this.mapearHallazgos(hallazgosData, acciones, responsables, offset),
        }))
      );
  }

  private mapearHallazgos(hallazgosData: any[], accionesData: any[], responsablesData: any[], offset: number): HallazgoTabla[] {
    const responsablesPorAccion = new Map<string, { nombre: string; lider: boolean }[]>();
    responsablesData.forEach((r: any) => {
      const accionId = typeof r.accion_mejora_id === 'object'
        ? r.accion_mejora_id?._id
        : r.accion_mejora_id;
      if (!accionId || !r.dependencia_nombre) return;
      const lista = responsablesPorAccion.get(accionId) ?? [];
      lista.push({ nombre: r.dependencia_nombre, lider: !!r.dependencia_lider });
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

    return hallazgosData
      .filter((h: any) => h.activo !== false)
      .map((h: any, i: number) => ({
        hallazgoId:  h._id,
        indice:      h.no_hallazgo ?? String(offset + i + 1),
        descripcion: h.descripcion ?? h.titulo ?? '',
        causa:       h.criterio ?? '',
        // En Ver Plan los hallazgos inician expandidos para ver el estado de cada acción
        expandido:   this.expansion.get(h._id) ?? this.vistaDictamen,
        acciones:    (accionesPorHallazgo.get(h._id) ?? [])
                       .map((a: any, j: number) => this.mapearAccion(a, j, responsablesPorAccion)),
      }));
  }

  // ─── Expansión ───────────────────────────────────────────────────────────────

  toggleHallazgo(hallazgoId: string): void {
    const h = this.getHallazgo(hallazgoId);
    if (!h) return;
    h.expandido = !h.expandido;
    this.expansion.set(hallazgoId, h.expandido);
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

  private remitirHallazgo(hallazgo: HallazgoTabla | undefined): void {
    if (!hallazgo) return;
    const dialogRef = this.dialog.open(ModalRemitirHallazgoComponent, {
      width: '600px',
      data: { hallazgo, auditoria: this.auditoria },
    });
    dialogRef.afterClosed().subscribe((resultado: ResultadoModalRemitirHallazgo | null) => {
      if (!resultado) return;
      this.recargarTrasCambio();
    });
  }

  private verHistoricoRemisiones(hallazgo: HallazgoTabla | undefined): void {
    if (!hallazgo) return;

    this.dialog.open(ModalHistorialRechazosComponent, {
      width: '900px',
      data: {
        auditoriaId: hallazgo.hallazgoId,
        estadoEndpoint: 'hallazgo-remision',
        auditoriaIdReferencia: 'hallazgo_id',
        titulo: 'Histórico de remisiones',
        descripcion: `Histórico de remisiones para el hallazgo ${hallazgo.indice}`,
      } as HistorialRechazosData,
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
        this.guardarResponsables(accionId, resultado.responsablesNuevos, (fallidos) => {
          this.registrarEstadoAccion(
            accionId,
            ESTADO_ACCION.PENDIENTE_REVISION,
            null,
            () => {
              this.expansion.set(hallazgo.hallazgoId, true);
              this.recargarTrasCambio();
              if (fallidos > 0) {
                this.alertService.showAlert(
                  'Acción guardada con observaciones',
                  `La acción se guardó, pero no se pudieron registrar ${fallidos} responsable(s). Verifique los responsables de la acción.`
                );
              } else {
                this.alertService.showSuccessAlert('Acción guardada correctamente.', 'Guardado');
              }
            },
            () => {
              this.expansion.set(hallazgo.hallazgoId, true);
              this.recargarTrasCambio();
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
              const finalizar = () => {
                this.recargarTrasCambio();
                this.alertService.showSuccessAlert('Acción guardada correctamente.', 'Guardado');
              };
              if (veniaRechazada) {
                this.registrarEstadoAccion(
                  accionAnterior.accionId!,
                  ESTADO_ACCION.PENDIENTE_REVISION,
                  null,
                  finalizar,
                  () => this.recargarTrasCambio()
                );
              } else {
                finalizar();
              }
            }
          );
        },
        error: () => this.alertService.showErrorAlert('Error al actualizar la acción de mejora.'),
      });
  }

  // ─── Revisión del auditor (dictamen por acción) ───────────────────────────────

  /** Etiqueta del dictamen según el estado de la acción */
  etiquetaDictamen(estadoId: number): string {
    if (estadoId === ESTADO_ACCION.APROBADA) return 'Conforme';
    if (estadoId === ESTADO_ACCION.RECHAZADA) return 'No conforme';
    return 'Pendiente';
  }

  /** Resumen del dictamen de las acciones de un hallazgo (fila de grupo) */
  resumenHallazgo(hallazgoId: string): { texto: string; clase: string } {
    const acciones = this.getHallazgo(hallazgoId)?.acciones ?? [];
    if (!acciones.length) return { texto: 'Sin acciones', clase: 'estado-sin-acciones' };

    const total = acciones.length;
    const aprobadas = acciones.filter(a => a.estadoId === ESTADO_ACCION.APROBADA).length;
    const rechazadas = acciones.filter(a => a.estadoId === ESTADO_ACCION.RECHAZADA).length;

    if (rechazadas > 0) return { texto: `No conforme (${rechazadas}/${total})`, clase: 'estado-rechazada' };
    if (aprobadas === total) return { texto: `Conforme (${aprobadas}/${total})`, clase: 'estado-aprobada' };
    return { texto: `Pendiente dictamen (${total - aprobadas}/${total})`, clase: 'estado-pendiente' };
  }

  /** Abre el modal de dictamen; fuera de revisión solo permite consultarlo */
  dictaminarAccion(fila: FilaTabla): void {
    const accion = fila.accion;
    if (!accion?.accionId) return;

    const data: DatosModalObservacionAccion = {
      hallazgo: {
        indice:      fila.hallazgoIndice,
        descripcion: fila.hallazgoDescripcion,
        causa:       fila.hallazgoCausa,
      },
      accion,
      soloLectura: !this.modoRevision,
    };

    const dialogRef = this.dialog.open(ModalObservacionAccionComponent, {
      width: '1000px',
      data,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((resultado: ResultadoDictamenAccion | null) => {
      if (!resultado) return;
      const aprobada = resultado.estadoId === ESTADO_ACCION.APROBADA;
      this.registrarEstadoAccion(
        accion.accionId!,
        resultado.estadoId,
        resultado.observacion,
        () => {
          this.alertService.showSuccessAlert(
            `La acción ${fila.hallazgoIndice}.${accion.numero} fue dictaminada como ${aprobada ? 'conforme' : 'no conforme'}.`,
            'Dictamen registrado'
          );
          this.recargarTrasCambio();
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
    callback: () => void,
    alFallar?: () => void
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
      error: () => {
        this.alertService.showErrorAlert('Error al registrar el estado de la acción.');
        alFallar?.();
      },
    });
  }

  eliminarAccion(hallazgo: HallazgoTabla | undefined, accion: AccionPlan | undefined): void {
    if (!hallazgo || !accion?.accionId) return;

    this.alertService.showConfirmAlert('¿Eliminar esta acción de mejora?').then(conf => {
      if (!conf.value) return;

      this.planAuditoriaService.delete('accion-mejora', { id: accion.accionId }).subscribe({
        next: () => this.recargarTrasCambio(),
        error: () => this.alertService.showErrorAlert('Error al eliminar la acción.'),
      });
    });
  }

  // ─── Responsables ────────────────────────────────────────────────────────────

  private guardarResponsables(
    accionId: string,
    responsables: { dependencia_id: number; dependencia_lider: boolean }[],
    callback: (fallidos: number) => void
  ): void {
    if (!responsables.length) { callback(0); return; }

    // catchError individual: un fallo no cancela el resto del forkJoin
    const requests = responsables.map(r =>
      this.planAuditoriaService.post('responsable-accion', {
        accion_mejora_id:  accionId,
        dependencia_id:    r.dependencia_id,
        dependencia_lider: r.dependencia_lider,
        activo:            true,
      }).pipe(catchError(err => { console.error('Error responsable:', err); return of(null); }))
    );

    forkJoin(requests).subscribe({
      next: (respuestas) => callback(respuestas.filter(r => r === null).length),
      error: () => callback(responsables.length),
    });
  }

  async exportarTabla(): Promise<void> {
    if (!this.informeId || !this.totalHallazgos) {
      this.alertService.showAlert('Sin registros', 'No hay hallazgos para exportar.');
      return;
    }

    // Con paginación la tabla solo tiene la página actual: se consulta el plan completo
    let todos: HallazgoTabla[];
    try {
      todos = (await firstValueFrom(this.consultarHallazgos(this.informeId, 0, 0))).hallazgos;
    } catch (error) {
      console.error('Error consultando hallazgos para exportar:', error);
      this.alertService.showErrorAlert('Error al exportar la tabla.');
      return;
    }

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

    // Una fila por acción; los hallazgos sin acciones también se exportan con las columnas de acción vacías
    const rows = todos.flatMap(hallazgo => {
      const datosHallazgo = [hallazgo.indice, hallazgo.descripcion, hallazgo.causa];
      if (!hallazgo.acciones.length) {
        return [[...datosHallazgo, '', '', '', '', '', '', '', '', '']];
      }
      return hallazgo.acciones.map(accion => [
        ...datosHallazgo,
        accion.numero,
        accion.tipoAccion,
        accion.accionPlanteada,
        accion.nombreIndicador,
        accion.formulaIndicador,
        accion.meta,
        accion.responsable,
        accion.fechaInicio,
        accion.fechaFin,
      ]);
    });

    const payload = {
        worksheets: [{
          name: "Acciones de mejora",
          rows: [headers, ...rows]
        }]
      };

    const consecutivoOCI = this.auditoria.consecutivo_OCI ?? 'sin_consecutivo';
    const tipoEvaluacion = this.auditoria.tipo_evaluacion_nombre?.toLowerCase().replace(/\s+/g, '_') ?? 'sin_tipo';

    try {
      const excel = await firstValueFrom(
        this.planAuditoriaMid.post('cargue-masivo/exportar-excel', payload).pipe(
          map((res: any) => {
            if (!res?.base64)
              throw new Error("Respuesta inválida del servidor: base64 no encontrado");

            return res.base64;
          })
        )
      );

      await this.descargaService.descargarArchivo(
        excel,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        `acciones_mejora_${tipoEvaluacion}_${consecutivoOCI}`
      );
    } catch (error) {
      console.error('Error exportar tabla:', error);
      this.alertService.showErrorAlert('Error al exportar la tabla.');
    }
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
