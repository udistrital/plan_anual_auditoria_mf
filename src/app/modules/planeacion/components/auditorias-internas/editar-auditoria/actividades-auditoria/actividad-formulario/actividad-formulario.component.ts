import { Component, Input, Output, EventEmitter,Inject   } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';


@Component({
  selector: 'app-actividad-formulario',
  templateUrl: './actividad-formulario.component.html',
  styleUrl: './actividad-formulario.component.css'
})
export class ActividadFormularioComponent {
  @Input() actividadData: any = {}; 
  @Output() formSubmit = new EventEmitter<any>();

  form: FormGroup | any;
  constructor(
    private fb: FormBuilder,
    //@Inject(MAT_DIALOG_DATA) public actividadData: any // Accediendo a los datos pasados
  ) {
    console.log("ACTIVIDAD ",this.actividadData)
    this.form = this.fb.group({
      nombreActividad: [this.actividadData.nombreActividad || ''],
      fechaInicio: [this.actividadData.fechaInicio || ''],
      fechaFin: [this.actividadData.fechaFin || ''],
      auditoriaID: [this.actividadData.auditoriaID || ''],
    });
  }
  
  guardarActividad() {
    console.log(this.form.value);
  }
}