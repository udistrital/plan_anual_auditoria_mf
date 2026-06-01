import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-modal-rechazo-plan',
  templateUrl: './modal-rechazo-plan.component.html',
  standalone: false,
})
export class ModalRechazoPlanComponent implements OnInit {
  form!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      planMejoramientoId: string;
      usuarioId: number;
      role: string;
    },
    private readonly dialogRef: MatDialogRef<ModalRechazoPlanComponent>,
    private readonly fb: FormBuilder,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      observacion: ['', Validators.required],
    });
  }

  confirmar(): void {
    if (this.form.invalid) {
      this.alertService.showErrorAlert('Debe ingresar una observación.');
      return;
    }

    this.alertService.showConfirmAlert('¿Está seguro(a) de rechazar el plan de mejoramiento?').then(conf => {
      if (!conf.value) return;
      this.rechazar();
    });
  }

  private rechazar(): void {
    const body = {
      plan_mejoramiento_id:   this.data.planMejoramientoId,
      usuario_id:             this.data.usuarioId,
      usuario_rol:            this.data.role,
      observacion:            this.form.value.observacion,
      estado_id:              environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.RECHAZADO_PLAN_MEJORAMIENTO,
      fase_id:                environment.AUDITORIA_FASE.PLAN_MEJORAMIENTO,
      fecha_ejecucion_estado: new Date().toISOString(),
      activo:                 true,
    };

    this.planAuditoriaService.post('plan-mejoramiento-estado', body).subscribe({
      next: () => {
        this.alertService.showSuccessAlert('El plan fue devuelto al auditado para corrección.', 'Plan rechazado');
        this.dialogRef.close(true);
      },
      error: () => {
        this.alertService.showErrorAlert('Error al rechazar el plan de mejoramiento.');
      },
    });
  }
}
