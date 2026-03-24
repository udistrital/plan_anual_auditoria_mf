import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { parse } from 'date-fns';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-actividad-formulario',
  templateUrl: './actividad-formulario.component.html',
  styleUrls: ['./actividad-formulario.component.css'],
})
export class ActividadFormularioComponent implements OnInit, OnDestroy {
  @Input() actividadData: any = {};
  @Output() formSubmit = new EventEmitter<any>();

  form: FormGroup;
  fechaMinFin: Date | null = null;

  private subs = new Subscription();

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      actividad: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: [{ value: '', disabled: true }, Validators.required],
      observaciones: ['', null],
      id: [''],
    });
  }

  ngOnInit(): void {
    if (this.actividadData) {
      const fechaInicioParseada = this.actividadData.fechaInicio
        ? parse(this.actividadData.fechaInicio, 'dd/MM/yyyy', new Date())
        : null;

      const fechaFinParseada = this.actividadData.fechaFin
        ? parse(this.actividadData.fechaFin, 'dd/MM/yyyy', new Date())
        : null;

      const data = {
        ...this.actividadData,
        fechaInicio: fechaInicioParseada,
        fechaFin: fechaFinParseada,
      };

      this.form.patchValue(data);

      // Si ya hay fechaInicio al cargar (modo edición), habilitar fechaFin y establecer mínimo
      if (fechaInicioParseada && !isNaN(fechaInicioParseada.getTime())) {
        this.fechaMinFin = fechaInicioParseada;
        this.form.get('fechaFin')!.enable();
      }
    }

    // Escuchar cambios en fechaInicio para habilitar/deshabilitar fechaFin
    const sub = this.form.get('fechaInicio')!.valueChanges.subscribe((fechaInicio: Date | null) => {
      const controlFechaFin = this.form.get('fechaFin')!;

      if (fechaInicio && !isNaN(new Date(fechaInicio).getTime())) {
        this.fechaMinFin = new Date(fechaInicio);
        controlFechaFin.enable();

        // Si la fechaFin actual es anterior a la nueva fechaInicio, limpiarla
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
    // getRawValue() incluye valores de controles deshabilitados
    const formValue = this.form.getRawValue();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.formSubmit.emit(formValue);
  }
}