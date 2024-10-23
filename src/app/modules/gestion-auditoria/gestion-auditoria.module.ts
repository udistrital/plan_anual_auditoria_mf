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
import { FormularioDinamicoComponent } from 'src/app/components/formulario-dinamico/formulario-dinamico.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';


@NgModule({
  declarations: [
    RegistroPlanAnualAuditoriaComponent,
    GestionAuditoriaComponent,
    FormularioDinamicoComponent
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
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatRadioModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    
  ],
  exports: [
    RegistroPlanAnualAuditoriaComponent,
    GestionAuditoriaComponent 
  ]
})
export class GestionAuditoriaModule { }
