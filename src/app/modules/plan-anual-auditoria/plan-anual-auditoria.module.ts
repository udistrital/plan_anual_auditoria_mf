import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { PlanAnualAuditoriaComponent } from './plan-anual-auditoria.component';
import { RevisionPlanAuditoriaModule } from '../revision-plan-auditoria/revision-plan-auditoria.module';
import { CargarArchivoModule } from '../cargar-archivo/cargar-archivo.module';
import { MatStepperModule } from '@angular/material/stepper';


@NgModule({
  declarations: [    
    PlanAnualAuditoriaComponent
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatGridListModule,
    MatListModule,
    PdfViewerModule,
    RevisionPlanAuditoriaModule,
    CargarArchivoModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatStepperModule
  ]
})
export class PlanAnualAuditoriaModule { }
