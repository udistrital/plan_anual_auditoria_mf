import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
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
  accionPlanteada: string;
  nombreIndicador: string;
  formulaIndicador: string;
  meta: string;
  responsable: string;
  fechaInicio: string;
  fechaFin: string;
}

/**
 * Fila del datasource plano.
 * - esGrupo = true  → fila de cabecera del hallazgo (usa columna 'grupo')
 * - esGrupo = false → fila de una acción concreta (usa columnas normales)
 */
export interface FilaTabla {
  esGrupo: boolean;
  hallazgoId: string;
  hallazgoIndice: string;
  hallazgoDescripcion: string;
  hallazgoCausa: string;        // ← criterio del hallazgo (campo 'criterio' del backend)
  accion?: AccionPlan;
}

@Component({
  selector: 'app-tabla-hallazgos',
  templateUrl: './tabla-hallazgos.component.html',
  styleUrls: ['./tabla-hallazgos.component.css'],
})
export class TablaHallazgosComponent implements OnInit {
  @Input() auditoriaId!: string;
  @Input() auditoria: any;

  hallazgos: HallazgoTabla[] = [];
  filas: FilaTabla[] = [];
  cargando = true;
  informeId!: string;

  columnas = [
    'noHallazgo', 'descripcion', 'causa', 'numero', 'tipoAccion',
    'accionPlanteada', 'nombreIndicador', 'formulaIndicador',
    'meta', 'responsable', 'fechaInicio', 'fechaFin', 'acciones',
  ];

  esFilaGrupo  = (_i: number, fila: FilaTabla) =>  fila.esGrupo;
  esFilaAccion = (_i: number, fila: FilaTabla) => !fila.esGrupo;

  constructor(
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.cargarHallazgos();
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  getHallazgo(hallazgoId: string): HallazgoTabla | undefined {
    return this.hallazgos.find(h => h.hallazgoId === hallazgoId);
  }

  private reconstruirFilas(): void {
    const filas: FilaTabla[] = [];

    this.hallazgos.forEach(h => {
      // Fila de cabecera del hallazgo (siempre visible)
      filas.push({
        esGrupo:             true,
        hallazgoId:          h.hallazgoId,
        hallazgoIndice:      h.indice,
        hallazgoDescripcion: h.descripcion,
        hallazgoCausa:       h.causa,
      });

      if (h.expandido) {
        if (h.acciones.length > 0) {
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
        } else {
          // Fila placeholder cuando no hay acciones
          filas.push({
            esGrupo:             false,
            hallazgoId:          h.hallazgoId,
            hallazgoIndice:      h.indice,
            hallazgoDescripcion: h.descripcion,
            hallazgoCausa:       h.causa,
            accion:              undefined,
          });
        }
      }
    });

    this.filas = filas;
  }

  // ─── Carga de datos ──────────────────────────────────────────────────────────

  cargarHallazgos(): void {
    const estadoPrevio = new Map<string, { expandido: boolean; acciones: AccionPlan[] }>();
    this.hallazgos.forEach(h => estadoPrevio.set(h.hallazgoId, {
      expandido: h.expandido,
      acciones:  h.acciones,
    }));

    this.planAuditoriaService
      .get(`informe?query=auditoria_id:${this.auditoriaId},activo:true`)
      .subscribe({
        next: (res) => {
          if (!res.Data?.length) { this.cargando = false; return; }
          this.informeId = res.Data[0]._id;
          this.cargarHallazgosDeInforme(estadoPrevio);
        },
        error: () => { this.cargando = false; }
      });
  }

  private cargarHallazgosDeInforme(
    estadoPrevio: Map<string, { expandido: boolean; acciones: AccionPlan[] }>
  ): void {
    this.planAuditoriaService
      .get(`tema?query=informe_id:${this.informeId}`)
      .subscribe({
        next: (res) => {
          const temas: any[] = res.Data ?? [];
          const hallazgosList: HallazgoTabla[] = [];
          let temaCount = 0;

          temas.forEach((tema: any) => {
            if (!tema.activo) return;
            temaCount++;
            let subtemaCount = 0;

            (tema.subtema ?? []).forEach((subtema: any) => {
              if (!subtema.activo) return;
              subtemaCount++;
              let hallazgoCount = 0;

              (subtema.hallazgo ?? []).forEach((hallazgo: any) => {
                if (!hallazgo.activo) return;
                hallazgoCount++;

                const previo = estadoPrevio.get(hallazgo._id);
                hallazgosList.push({
                  hallazgoId:  hallazgo._id,
                  indice:      `${temaCount}.${subtemaCount}.${hallazgoCount}`,
                  descripcion: hallazgo.descripcion ?? hallazgo.titulo ?? '',
                  causa:       hallazgo.criterio   ?? '',   // ← campo correcto del backend
                  acciones:    previo?.acciones  ?? [],
                  expandido:   previo?.expandido ?? false,
                });
              });
            });
          });

          this.hallazgos = hallazgosList;
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
      },
    });

    dialogRef.afterClosed().subscribe((resultado: AccionPlan | null) => {
      if (!resultado) return;

      if (accion) {
        const idx = hallazgo.acciones.indexOf(accion);
        if (idx !== -1) hallazgo.acciones[idx] = resultado;
      } else {
        hallazgo.acciones.push({
          ...resultado,
          numero: String(hallazgo.acciones.length + 1),
        });
      }

      hallazgo.expandido = true;
      this.reconstruirFilas();
    });
  }

  // ─── Eliminar (mock local) ───────────────────────────────────────────────────

  eliminarAccion(hallazgo: HallazgoTabla | undefined, accion: AccionPlan | undefined): void {
    if (!hallazgo || !accion) return;
    hallazgo.acciones = hallazgo.acciones
      .filter(a => a !== accion)
      .map((a, i) => ({ ...a, numero: String(i + 1) }));
    this.reconstruirFilas();
  }
}