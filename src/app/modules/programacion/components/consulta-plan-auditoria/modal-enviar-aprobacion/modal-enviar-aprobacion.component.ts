import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-modal-enviar-aprobacion',
    templateUrl: './modal-enviar-aprobacion.component.html',
    standalone: false
})
export class ModalEnviarAprobacionComponent {
  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<ModalEnviarAprobacionComponent>
  ) {
    this.form = this.fb.group({
      observacion: [''],
    });

    this.dialogRef.beforeClosed().subscribe((result) => {
      if (result === undefined) {
        this.dialogRef.close(null);
      }
    });
  }

  confirmar(): void {
    // Retorna string (puede ser vacío), null significa que canceló
    this.dialogRef.close(this.form.value.observacion ?? '');
  }
}