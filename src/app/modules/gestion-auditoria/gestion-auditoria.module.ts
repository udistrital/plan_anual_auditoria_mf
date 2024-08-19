import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistroPlanAnualAuditoriaComponent } from './registro-plan-anual-auditoria/registro-plan-anual-auditoria.component';
import { GestionAuditoriaComponent } from './gestion-auditoria.component';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  declarations: [
    RegistroPlanAnualAuditoriaComponent,
    GestionAuditoriaComponent
  ],
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    MatDialogModule
  ]
})
export class GestionAuditoriaModule { }
