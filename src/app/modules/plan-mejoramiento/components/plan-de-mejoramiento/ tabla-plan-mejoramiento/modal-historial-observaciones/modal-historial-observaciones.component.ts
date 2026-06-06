import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { TercerosService } from 'src/app/shared/services/terceros.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-modal-historial-observaciones',
  templateUrl: './modal-historial-observaciones.component.html',
  styleUrls: ['./modal-historial-observaciones.component.css'],
  standalone: false,
})
export class ModalHistorialObservacionesComponent implements OnInit {
  observaciones: any[] = [];
  cargando = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly data: { planMejoramientoId: string },
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly tercerosService: TercerosService,
  ) {}

  ngOnInit(): void {
    this.cargarObservaciones();
  }

  private cargarObservaciones(): void {
    const estadoRechazado = environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.RECHAZADO_PLAN_MEJORAMIENTO;

    this.planAuditoriaService
      .get(`plan-mejoramiento-estado?query=plan_mejoramiento_id:${this.data.planMejoramientoId},estado_id:${estadoRechazado},activo:true&limit=0&sortby=fecha_ejecucion_estado&order=desc`)
      .pipe(
        switchMap((res) => {
          const estados: any[] = res?.Data ?? [];
          if (!estados.length) return of([]);

          return forkJoin(
            estados.map((e) =>
              this.tercerosService.getTerceroById(e.usuario_id).pipe(
                catchError(() => of(null)),
              ).pipe(
                switchMap((tercero) => of({
                  ...e,
                  usuario: { nombre: tercero?.NombreCompleto ?? String(e.usuario_id) },
                }))
              )
            )
          );
        })
      )
      .subscribe({
        next: (obs) => {
          this.observaciones = obs;
          this.cargando = false;
        },
        error: () => {
          this.observaciones = [];
          this.cargando = false;
        },
      });
  }
}
