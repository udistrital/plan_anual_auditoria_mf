import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { parse } from 'date-fns';

@Component({
  selector: 'app-actividad-formulario',
  templateUrl: './actividad-formulario.component.html',
  styleUrls: ['./actividad-formulario.component.css'],
})
export class ActividadFormularioComponent {
  @Input() actividadData: any = {}; // Recibe los datos iniciales
  @Output() formSubmit = new EventEmitter<any>(); // Envía los datos actualizados al componente padre

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      actividad: [''],
      fechaInicio: [''],
      fechaFin: [''],
      id:[''],
    });
  }

  ngOnInit(): void {
    if (this.actividadData) {
      const data = {
        ...this.actividadData,
        fechaInicio: this.actividadData.fechaInicio
          ? parse(this.actividadData.fechaInicio, 'dd/MM/yyyy', new Date())
          : null,
        fechaFin: this.actividadData.fechaFin
          ? parse(this.actividadData.fechaFin, 'dd/MM/yyyy', new Date())
          : null,
      };
  
      this.form.patchValue(data);
    }
  }

  guardarActividad() {
    this.formSubmit.emit(this.form.value); // Envía los datos al componente padre
  }
}