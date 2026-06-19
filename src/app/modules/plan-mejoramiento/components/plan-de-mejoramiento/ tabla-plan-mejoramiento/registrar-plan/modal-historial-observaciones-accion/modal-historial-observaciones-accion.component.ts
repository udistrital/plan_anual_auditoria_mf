import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { TercerosService } from 'src/app/shared/services/terceros.service';
import { environment } from 'src/environments/environment';

const ESTADO = environment.ACCION_MEJORA_ESTADOS;

@Component({
  selector: 'app-modal-historial-observaciones-accion',
  templateUrl: './modal-historial-observaciones-accion.component.html',
  styleUrls: ['./modal-historial-observaciones-accion.component.css'],
  standalone: false,
})
export class ModalHistorialObservacionesAccionComponent implements OnInit {
  estados: any[] = [];
  accionPlanteada = '';
  cargando = true;

  readonly ESTADO_ACCION = ESTADO;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    private readonly data: { accionMejoraId: string; accionPlanteada: string },
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly tercerosService: TercerosService,
  ) { }

  ngOnInit(): void {
    this.accionPlanteada = this.data.accionPlanteada ?? '';
    this.cargarHistorial();
  }

  private cargarHistorial(): void {
    // Solo aprobaciones y rechazos, se excluye PENDIENTE_REVISION
    this.planAuditoriaMid
      .get(`accion-mejora-estado?query=accion_mejora_id:${this.data.accionMejoraId},estado_id__in:${ESTADO.APROBADA}|${ESTADO.RECHAZADA},activo:true&limit=0&sortby=fecha_ejecucion_estado&order=desc`)
      .pipe(
        switchMap((res) => {
          const estados: any[] = res?.Data ?? [];
          if (!estados.length) return of([]);

          return forkJoin(
            estados.map((e) =>
              this.tercerosService.getTerceroById(e.usuario_id).pipe(
                catchError(() => of(null)),
                switchMap((tercero) => of({
                  ...e,
                  usuario: { nombre: tercero?.NombreCompleto ?? String(e.usuario_id) },
                })),
              )
            )
          );
        })
      )
      .subscribe({
        next: (data) => {
          this.estados = data;
          this.cargando = false;
        },
        error: () => {
          this.estados = [];
          this.cargando = false;
        },
      });
  }
}
