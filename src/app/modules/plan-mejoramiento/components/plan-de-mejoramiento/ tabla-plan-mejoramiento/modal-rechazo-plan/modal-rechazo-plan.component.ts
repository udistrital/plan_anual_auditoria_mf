import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { environment } from 'src/environments/environment';

export interface DatosModalRechazoPlan {
  planMejoramientoId: string;
  usuarioId: number;
  role: string | null;
  /** Datos informativos del aviso de devolución */
  expediente?: string;
  dependencias?: string;
  accionesRechazadas?: number;
}

/** Devolución del plan de mejoramiento a la dependencia con observaciones */
@Component({
  selector: 'app-modal-rechazo-plan',
  templateUrl: './modal-rechazo-plan.component.html',
  styleUrls: ['./modal-rechazo-plan.component.css'],
  standalone: false,
})
export class ModalRechazoPlanComponent implements OnInit {
  readonly MAX_OBSERVACION = 1000;
  form!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DatosModalRechazoPlan,
    private readonly dialogRef: MatDialogRef<ModalRechazoPlanComponent>,
    private readonly fb: FormBuilder,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      observacion: ['', [Validators.required, Validators.maxLength(this.MAX_OBSERVACION)]],
    });
  }

  get longitudObservacion(): number {
    return this.form.get('observacion')?.value?.length ?? 0;
  }

  confirmar(): void {
    const observacion = this.form.get('observacion');
    if (observacion?.value && !observacion.value.trim()) {
      observacion.setErrors({ required: true });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.alertService.showConfirmAlert('¿Está seguro(a) de devolver el plan de mejoramiento con observaciones?').then(conf => {
      if (!conf.value) return;
      this.rechazar();
    });
  }

  private rechazar(): void {
    const body = {
      plan_mejoramiento_id:   this.data.planMejoramientoId,
      usuario_id:             this.data.usuarioId,
      usuario_rol:            this.data.role,
      observacion:            this.form.value.observacion.trim(),
      estado_id:              environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.RECHAZADO_PLAN_MEJORAMIENTO,
      fase_id:                environment.AUDITORIA_FASE.PLAN_MEJORAMIENTO,
      fecha_ejecucion_estado: new Date().toISOString(),
      activo:                 true,
    };

    this.planAuditoriaService.post('plan-mejoramiento-estado', body).subscribe({
      next: () => {
        this.alertService.showSuccessAlert('El plan fue devuelto a la dependencia para su subsanación.', 'Plan devuelto');
        this.dialogRef.close(true);
      },
      error: () => {
        this.alertService.showErrorAlert('Error al devolver el plan de mejoramiento.');
      },
    });
  }
}
