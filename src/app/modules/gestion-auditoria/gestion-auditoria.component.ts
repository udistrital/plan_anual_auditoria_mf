import {Component, OnInit, ViewChild } from '@angular/core';
import {MatStepper} from "@angular/material/stepper";
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {RegistroPlanAnualAuditoriaComponent} from "./registro-plan-anual-auditoria/registro-plan-anual-auditoria.component";

@Component({
  selector: 'app-gestion-auditoria',
  templateUrl: './gestion-auditoria.component.html',
  styleUrls: ['./gestion-auditoria.component.css']
})
export class GestionAuditoriaComponent implements OnInit{
  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild(RegistroPlanAnualAuditoriaComponent) registroPlan!: RegistroPlanAnualAuditoriaComponent;

  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;

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
}