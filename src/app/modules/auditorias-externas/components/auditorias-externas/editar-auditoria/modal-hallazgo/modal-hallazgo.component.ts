import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ModalHallazgoData {
  hallazgo?: { hallazgoId: string; criterio: string; descripcion: string };
}

@Component({
  selector: 'app-modal-hallazgo',
  templateUrl: './modal-hallazgo.component.html',
})
export class ModalHallazgoComponent {
  form: FormGroup;
  esEdicion: boolean;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModalHallazgoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ModalHallazgoData
  ) {
    this.esEdicion = !!data.hallazgo;
    this.form = this.fb.group({
      criterio: [data.hallazgo?.criterio ?? '', Validators.required],
      hallazgo: [data.hallazgo?.descripcion ?? '', Validators.required],
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.value);
  }
}
