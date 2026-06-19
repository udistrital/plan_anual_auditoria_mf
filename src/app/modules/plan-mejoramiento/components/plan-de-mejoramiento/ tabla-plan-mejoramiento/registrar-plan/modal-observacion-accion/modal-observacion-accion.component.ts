import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/services/alert.service';

export interface DatosModalObservacionAccion {
  accionPlanteada: string;
  /** Configurable para reutilizar el modal en aprobación y rechazo */
  titulo?: string;
  descripcion?: string;
  etiqueta?: string;
  textoBoton?: string;
  icono?: string;
  confirmMsg?: string;
}

@Component({
  selector: 'app-modal-observacion-accion',
  templateUrl: './modal-observacion-accion.component.html',
  standalone: false,
})
export class ModalObservacionAccionComponent implements OnInit {
  form!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DatosModalObservacionAccion,
    private readonly dialogRef: MatDialogRef<ModalObservacionAccionComponent>,
    private readonly fb: FormBuilder,
    private readonly alertService: AlertService,
  ) {}

  // Valores por defecto: comportamiento de rechazo
  get titulo(): string { return this.data.titulo ?? 'Rechazar Acción de Mejora'; }
  get descripcion(): string { return this.data.descripcion ?? 'Indique el motivo del rechazo de la acción'; }
  get etiqueta(): string { return this.data.etiqueta ?? 'Motivo del rechazo'; }
  get textoBoton(): string { return this.data.textoBoton ?? 'Rechazar'; }
  get icono(): string { return this.data.icono ?? 'block_flipped'; }

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

    this.alertService.showConfirmAlert(this.data.confirmMsg ?? '¿Rechazar esta acción de mejora?').then(conf => {
      if (!conf.value) return;
      // Devuelve la observación; el componente padre registra el estado correspondiente
      this.dialogRef.close(this.form.value.observacion);
    });
  }
}
