import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ModalRegistrarAccionComponent } from '../modal-registrar-accion/modal-registrar-accion.component';

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
}

export interface ResultadoModalAccion {
  accion: {
    tipoAccionId: number;
    accionPlanteada: string;
    nombreIndicador: string;
    formulaIndicador: string;
    meta: string;
    accionId?: string;
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

@Component({
    selector: 'app-tabla-hallazgos',
    templateUrl: './tabla-hallazgos.component.html',
    styleUrls: ['./tabla-hallazgos.component.css'],
    standalone: false
})
export class TablaHallazgosComponent implements OnInit {
  @Input() auditoriaId!: string;
  @Input() planMejoramientoId!: string;
  @Input() auditoria: any;

  hallazgos: HallazgoTabla[] = [];
  filas: FilaTabla[] = [];
  cargando = true;

  columnas = [
    'noHallazgo', 'descripcion', 'causa', 'numero', 'tipoAccion',
    'accionPlanteada', 'nombreIndicador', 'formulaIndicador',
    'meta', 'responsable', 'fechaInicio', 'fechaFin', 'acciones',
  ];

  esFilaGrupo  = (_i: number, fila: FilaTabla) =>  fila.esGrupo;
  esFilaAccion = (_i: number, fila: FilaTabla) => !fila.esGrupo;

  constructor(
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly alertService: AlertService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
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

  private mapearAccion(a: any, index: number): AccionPlan {
    return {
      accionId:         a._id,
      numero:           String(index + 1),
      tipoAccionId:     a.tipo_id ?? 1,
      tipoAccion:       TIPO_NOMBRES[a.tipo_id] ?? '',
      accionPlanteada:  a.descripcion ?? '',
      nombreIndicador:  a.nombre_indicador ?? '',
      formulaIndicador: a.formula_indicador ?? '',
      meta:             a.meta ?? '',
      responsable:      '',
      fechaInicio:      a.fecha_inicio ?? '',
      fechaFin:         a.fecha_fin ?? '',
    };
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
            return of({ hallazgos: { Data: [] }, acciones: { Data: [] } });
          }
          const informeId = resInforme.Data[0]._id;
          return forkJoin({
            hallazgos: this.planAuditoriaService
              .get(`hallazgo?query=informe_id:${informeId},activo:true`),
            acciones: this.planAuditoriaService
              .get(`accion-mejora?query=plan_mejoramiento_id:${this.planMejoramientoId},activo:true`)
              .pipe(catchError(() => of({ Data: [] }))),
          });
        })
      )
      .subscribe({
        next: ({ hallazgos, acciones }) => {
          const accionesData: any[] = acciones.Data ?? [];
          const accionesPorHallazgo = new Map<string, any[]>();
          accionesData.forEach((a: any) => {
            // hallazgo_id puede venir como string o como objeto populado { _id, ... }
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
              indice:      String(i + 1),
              descripcion: h.descripcion ?? h.titulo ?? '',
              causa:       h.criterio ?? '',
              expandido:   estadoPrevio.get(h._id) ?? false,
              acciones:    (accionesPorHallazgo.get(h._id) ?? [])
                             .map((a: any, j: number) => this.mapearAccion(a, j)),
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
      width: '900px',
      data: {
        hallazgo,
        accion: accion ?? null,
        auditoria: this.auditoria,
        planMejoramientoId: this.planMejoramientoId,
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
      activo:               true,
    };

    this.planAuditoriaService.post('accion-mejora', body).subscribe({
      next: (res: any) => {
        const accionId = res.Data._id;
        this.guardarResponsables(accionId, resultado.responsablesNuevos, () => {
          hallazgo.expandido = true;
          this.cargarDatos();
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
    };

    this.planAuditoriaService
      .put(`accion-mejora/${accionAnterior.accionId}`, body as any)
      .subscribe({
        next: () => {
          this.sincronizarResponsables(
            accionAnterior.accionId!,
            resultado.responsablesNuevos,
            resultado.responsablesAEliminar,
            () => this.cargarDatos()
          );
        },
        error: () => this.alertService.showErrorAlert('Error al actualizar la acción de mejora.'),
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
