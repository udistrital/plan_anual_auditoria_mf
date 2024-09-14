import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-formulario-auditoria-especial',
  templateUrl: './formulario-auditoria-especial.component.html',
  styleUrls: ['./formulario-auditoria-especial.component.css']
})
export class FormularioAuditoriaEspecialComponent {

  form!: FormGroup;
  auditores = ['Pepito Pérez', 'Juanita Gómez'];
  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre',
     'Diciembre', 'Todos'
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FormularioAuditoriaEspecialComponent>
  ) {
    this.form = this.fb.group({
      tituloAuditoria: [''],
      auditor: [''],
      cronograma: [[]],
    });
  }

  agregarAuditor() {

  }

  guardar() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

}
