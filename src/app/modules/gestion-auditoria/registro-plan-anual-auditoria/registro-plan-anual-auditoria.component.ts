import { Component, OnInit } from '@angular/core';
import {FormBuilder, Validators, FormGroup, ValidationErrors, AbstractControl} from '@angular/forms';

@Component({
  selector: 'app-registro-plan-anual-auditoria',
  templateUrl: './registro-plan-anual-auditoria.component.html',
  styleUrls: ['./registro-plan-anual-auditoria.component.css']
})
export class RegistroPlanAnualAuditoriaComponent implements OnInit{
  
  datos = [
    { no: 1, auditoria: 'titulo', tipoEvaluacion: 'Auditoria Interna' , cronogramaActividades: 'Mes',  estado: 'Sin Iniciar' },
    { no: 2, auditoria: 'titulo', tipoEvaluacion: 'seguimiento' , cronogramaActividades: 'Mes',  estado: 'Sin Iniciar' },
    { no: 4, auditoria: 'titulo', tipoEvaluacion: 'seguimiento' , cronogramaActividades: 'Mes',  estado: 'Sin Iniciar' },
    { no: 5, auditoria: 'titulo', tipoEvaluacion: 'seguimiento' , cronogramaActividades: 'Mes',  estado: 'Sin Iniciar' },
    { no: 6, auditoria: 'titulo', tipoEvaluacion: 'informe' , cronogramaActividades: 'Mes',  estado: 'Sin Iniciar' },
  ];
  columnsToDisplay: string[] = ['no', 'auditoria', 'tipoEvaluacion', 'cronogramaActividades', 'estado', 'acciones'];

  resetComponent() {

  }
  onStepLeave() {
    this.resetComponent();
  }
  ngOnInit(): void {
    
  }
}
