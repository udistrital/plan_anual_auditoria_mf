import { Component } from '@angular/core';
import {FormBuilder, Validators, FormGroup, ValidationErrors, AbstractControl} from '@angular/forms';

@Component({
  selector: 'app-registro-plan-anual-auditoria',
  templateUrl: './registro-plan-anual-auditoria.component.html',
  styleUrls: ['./registro-plan-anual-auditoria.component.css']
})
export class RegistroPlanAnualAuditoriaComponent {
  resetComponent() {

  }
  onStepLeave() {
    this.resetComponent();
  }
}
