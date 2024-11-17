import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EditarAuditoriaModule } from './modules/programacion/editar-auditoria/editar-auditoria.module';
import { ConsultaPlanAnualAuditoriaModule } from './modules/programacion/consulta-plan-anual-auditoria/consulta-plan-anual-auditoria.module';
import { RevisionJefeModule } from './modules/programacion/revision-jefe/revision-jefe.module';
import { AsignacionAuditoresModule } from './modules/programacion/asignacion-auditores/asignacion-auditores.module'
import { AuditoriasEspecialesModule } from './modules/programacion/auditorias-especiales/auditorias-especiales.module';
import { FormularioAuditoriaEspecialModule } from './modules/programacion/auditorias-especiales/formulario-auditoria-especial/formulario-auditoria-especial.module';
import { RegistrarAuditoriasModule } from './modules/programacion/registrar-auditorias/registrar-auditorias.module';
import { CargarArchivoModule } from './modules/cargar-archivo/cargar-archivo.module';
import { FormularioDinamicoModule } from './components/formulario-dinamico/formulario-dinamico.module';
import { RegistrarPlanModule } from './modules/programacion/registrar-plan/registrar-plan.module';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { EditarAuditoriaRoutingModule } from './modules/programacion/editar-auditoria/editar-auditoria-routing.module';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { RegistrarPlanComponent } from './modules/programacion/registrar-plan/registrar-plan.component';

//Services
import { PlanAnualAuditoriaService } from 'src/app/services/plan-anual-auditoria.service';



@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    EditarAuditoriaModule,
    ConsultaPlanAnualAuditoriaModule,
    RevisionJefeModule,
    AsignacionAuditoresModule,
    AuditoriasEspecialesModule,
    FormularioAuditoriaEspecialModule,
    RegistrarAuditoriasModule,
    FormularioDinamicoModule,
    RegistrarPlanModule,
    CommonModule,
    CargarArchivoModule,
    MatStepperModule,
    MatButtonModule,
    MatDialogModule,
    EditarAuditoriaRoutingModule,
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
  providers: [
    PlanAnualAuditoriaService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
