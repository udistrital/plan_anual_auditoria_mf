import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Actividad as ActividadPlan } from 'src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria';

@Component({
  selector: 'app-actividad-seguimiento-formulario',
  templateUrl: './actividad-formulario.component.html',
  styleUrls: ['./actividad-formulario.component.css'],
})
export class ActividadSeguimientoFormularioComponent {
  @Input() actividadData: ActividadPlan | null = null; // Recibe los datos iniciales
  @Input() minFechaStr: string | null = null;
  @Input() maxFechaStr: string | null = null;
  @Output() formSubmit = new EventEmitter<ActividadPlan>(); // Envía los datos actualizados al componente padre

  form: FormGroup;
  fechaMinFin: Date | null = null;
  minFecha: Date | null = null;
  maxFecha: Date | null = null;

  private subs = new Subscription();

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      actividad: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: [{ value: '', disabled: true }, Validators.required],
      observaciones: ['', null],
      papelTrabajoReferencia: ['', null],
      papelTrabajoDescripcion: ['', null],
      papelTrabajoFolios: ['', null],
      papelTrabajoMedio: ['', null],
      papelTrabajoCarpeta: ['', null],
      id: [''],
    });
  }

  ngOnInit(): void {
    this.minFecha = this.minFechaStr ? new Date(this.minFechaStr.toString().substring(0, 10) + 'T00:00:00') : null;
    this.maxFecha = this.maxFechaStr ? new Date(this.maxFechaStr.toString().substring(0, 10) + 'T00:00:00') : null;

    if (this.actividadData) {
      const fechaInicioParseada = this.actividadData.fechaInicio;
      const fechaFinParseada = this.actividadData.fechaFin;

      const data = {
        ...this.actividadData,
        fechaInicio: fechaInicioParseada,
        fechaFin: fechaFinParseada,
      };

      this.form.patchValue(data);

      if (fechaInicioParseada && !isNaN(fechaInicioParseada.getTime())) {
        this.fechaMinFin = fechaInicioParseada;
        this.form.get('fechaFin')!.enable();
      }
    }

    const sub = this.form.get('fechaInicio')!.valueChanges.subscribe((fechaInicio: Date | null) => {
      const controlFechaFin = this.form.get('fechaFin')!;

      if (fechaInicio && !isNaN(new Date(fechaInicio).getTime())) {
        this.fechaMinFin = new Date(fechaInicio);
        controlFechaFin.enable();

        const fechaFinActual: Date | null = controlFechaFin.value;
        if (fechaFinActual && fechaFinActual < this.fechaMinFin) {
          controlFechaFin.setValue(null);
        }
      } else {
        this.fechaMinFin = null;
        controlFechaFin.setValue(null);
        controlFechaFin.disable();
      }
    });

    this.subs.add(sub);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  guardarActividad() {
    const formValue = this.form.getRawValue();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.formSubmit.emit(formValue);
  }
}
