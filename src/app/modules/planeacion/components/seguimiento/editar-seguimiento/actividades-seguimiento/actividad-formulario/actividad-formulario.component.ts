import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { parse } from 'date-fns';
import { Actividad as ActividadPlan } from 'src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria';

@Component({
  selector: 'app-actividad-seguimiento-formulario',
  templateUrl: './actividad-formulario.component.html',
  styleUrls: ['./actividad-formulario.component.css'],
})
export class ActividadSeguimientoFormularioComponent {
  @Input() actividadData: ActividadPlan | null = null; // Recibe los datos iniciales
  @Output() formSubmit = new EventEmitter<ActividadPlan>(); // Envía los datos actualizados al componente padre

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      actividad: [''],
      fechaInicio: [''],
      fechaFin: [''],
      observaciones: [''],
      papelTrabajoReferencia: [''],
      papelTrabajoDescripcion: [''],
      papelTrabajoFolios: [''],
      papelTrabajoMedio: [''],
      papelTrabajoCarpeta: [''],
      id:[''],
    });
  }

  ngOnInit(): void {
    if (this.actividadData) {
      const data = {
        ...this.actividadData,
        fechaInicio: this.actividadData.fechaInicio,
        fechaFin: this.actividadData.fechaFin,
      };
  
      this.form.patchValue(data);
    }
  }

  guardarActividad() {
    this.formSubmit.emit(this.form.value); // Envía los datos al componente padre
  }
}
