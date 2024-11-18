import { importProvidersFrom, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RegistrarPlanComponent } from './registrar-plan.component';
import { FormularioDinamicoModule } from 'src/app/components/formulario-dinamico/formulario-dinamico.module';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ReactiveFormsModule } from '@angular/forms';

//Servicios
import { PlanAnualAuditoriaService } from 'src/app/services/plan-anual-auditoria.service';

@NgModule({
  declarations: [
    RegistrarPlanComponent,
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatMenuModule,
    MatInputModule,
    MatDividerModule,
    MatCardModule,
    ReactiveFormsModule,
    DragDropModule,
    FormularioDinamicoModule
  ],
  providers: [
    PlanAnualAuditoriaService
  ]
})
export class RegistrarPlanModule { }