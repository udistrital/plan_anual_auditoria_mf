import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistroPlanAnualAuditoriaComponent } from './registro-plan-anual-auditoria/registro-plan-anual-auditoria.component';
import { GestionAuditoriaComponent } from './gestion-auditoria.component';
import { MatStepperModule } from '@angular/material/stepper'; 
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { GestionAuditoriaRoutingModule } from './gestion-auditoria-routing.module';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    RegistroPlanAnualAuditoriaComponent,
    GestionAuditoriaComponent,
  ],
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    MatDialogModule,
    GestionAuditoriaRoutingModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule
    
  ],
  exports: [
    RegistroPlanAnualAuditoriaComponent,
    GestionAuditoriaComponent 
  ]
})
export class GestionAuditoriaModule { }
