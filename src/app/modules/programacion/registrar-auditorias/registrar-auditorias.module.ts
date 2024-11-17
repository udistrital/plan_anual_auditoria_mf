import { importProvidersFrom, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RegistrarAuditoriasComponent } from './registrar-auditorias.component';
import { AddAuditoriaModalComponent } from './add-auditoria-modal/add-auditoria-modal.component';
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
import { ParametrosService } from 'src/app/services/parametros.service';
import { PlanAnualAuditoriaService } from 'src/app/services/plan-anual-auditoria.service';

import {RevisionJefeModule} from '../revision-jefe/revision-jefe.module';


@NgModule({
  declarations: [
    RegistrarAuditoriasComponent,
    AddAuditoriaModalComponent
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
    RevisionJefeModule,
  ],
  providers: [
    ParametrosService,
    PlanAnualAuditoriaService
  ]
})
export class RegistrarAuditoriasModule { }