import { Component, Input, OnInit, Output, EventEmitter  } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Formulario } from 'src/app/data/models/formulario.model';

@Component({
  selector: 'app-formulario-dinamico',
  templateUrl: './formulario-dinamico.component.html',
  styleUrls: ['./formulario-dinamico.component.css']
})

export class FormularioDinamicoComponent implements OnInit {
  @Input() formulario: Formulario = { campos: [] };
  // @Input() modo: 'crear' | 'editar' = 'crear'; 
  @Output() submitFormulario = new EventEmitter<any>();
  form: FormGroup = this.fb.group({});

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.form = this.fb.group({});

    if (this.formulario?.campos) {
      this.formulario.campos.forEach(campo => {
        const validators = this.getValidators(campo.validaciones);

        if (campo.nombre) {
          this.form.addControl(campo.nombre, this.fb.control(
            { value: campo.valor || '', disabled: campo.deshabilitado }, validators));
        }
      });
    };
  }

  getValidators(validaciones: any[]): any[] {
    const validators: any[] = [];
    if (validaciones) {
      validaciones.forEach((validacion: any) => {
        if (validacion) {
          if (validacion.tipo == 'requerido') {
            validators.push(Validators.required);
          }
          if (validacion.tipo == 'minLength') {
            validators.push(Validators.minLength(validacion.valor));
          }
          if (validacion.tipo == 'maxLength') {
            validators.push(Validators.maxLength(validacion.valor));
          }
          if (validacion.tipo == 'patron') {
            validators.push(Validators.pattern(validacion.valor));
          }
          if (validacion.tipo == 'min') {
            validators.push(Validators.min(validacion.valor));
          }
          if (validacion.tipo == 'max') {
            validators.push(Validators.max(validacion.valor));
          }
          if (validacion.tipo == 'email') {
            validators.push(Validators.email);
          }
        }
      });
    }


    return validators;
  }


   onSubmit(): void {
    if (this.form.valid) {
      const formData = this.form.value;
      this.submitFormulario.emit(formData); 
    } else {
      console.log('Formulario no válido', this.form);
    }
  }
}
