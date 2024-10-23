import {Component, OnInit, ViewChild } from '@angular/core';
import {MatStepper} from "@angular/material/stepper";
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {RegistroPlanAnualAuditoriaComponent} from "./registro-plan-anual-auditoria/registro-plan-anual-auditoria.component";
import { Formulario } from 'src/app/data/models/formulario.model';
import { formularioQuemado } from 'src/app/data/forms/formulario-quemado';
import { FormularioDinamicoComponent } from 'src/app/components/formulario-dinamico/formulario-dinamico.component';

@Component({
  selector: 'app-gestion-auditoria',
  templateUrl: './gestion-auditoria.component.html',
  styleUrls: ['./gestion-auditoria.component.css']
})
export class GestionAuditoriaComponent implements OnInit{
  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild(RegistroPlanAnualAuditoriaComponent) registroPlan!: RegistroPlanAnualAuditoriaComponent;
  @ViewChild(FormularioDinamicoComponent) formularioDinamico!: FormularioDinamicoComponent;

  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  formulario: Formulario | undefined;

  constructor(private _formBuilder: FormBuilder) {
    this.firstFormGroup = this._formBuilder.group({});
    this.secondFormGroup = this._formBuilder.group({});
  }
  ngOnInit() {
     // Paso 1
    this.firstFormGroup = this._formBuilder.group({
      secondCtrl: ['', Validators.required],
    });
    // Paso 2
    this.secondFormGroup = this._formBuilder.group({
      secondCtrl: ['', Validators.required],
    });
    this.loadFormulario();
  }

  isLinear = false;

  ngAfterViewInit() {
    this.stepper.selectionChange.subscribe((event) => {
      //Reset del componente (ligado al orden)
      if (event.previouslySelectedIndex === 3 && event.selectedIndex !== 3) {
        this.registroPlan.onStepLeave();
      }
    });
  }

  loadFormulario(): void {
    // Asignamos el formulario quemado directamente
    this.formulario = formularioQuemado;
  }

  enviarFormulario(): void {
    this.formularioDinamico.onSubmit();
  }

  manejarEnvio(formData: any): void {
    console.log('Formulario enviado:', formData);
    // manejar la lógica de envío del formulario
  }
}