import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GestionAuditoriaModule } from './modules/gestion-auditoria/gestion-auditoria.module';
import { ConsultaPlanAnualAuditoriaModule } from './modules/programacion/consulta-plan-anual-auditoria/consulta-plan-anual-auditoria.module';
import { AsignacionAuditoresModule } from './modules/programacion/asignacion-auditores/asignacion-auditores.module';
import { AuditoriasEspecialesModule } from './modules/programacion/auditorias-especiales/auditorias-especiales.module';
import { FormularioAuditoriaEspecialModule } from './modules/gestion-auditoria/formulario-auditoria-especial/formulario-auditoria-especial.module';
import { RegistrarAuditoriasModule } from './modules/programacion/registrar-auditorias/registrar-auditorias.module';
import { CargarArchivoModule } from './modules/cargar-archivo/cargar-archivo.module';
import { GestionAuditoriaComponent } from './modules/gestion-auditoria/gestion-auditoria.component';
import { FormularioDinamicoComponent } from './components/formulario-dinamico/formulario-dinamico.component';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { GestionAuditoriaRoutingModule } from './modules/gestion-auditoria/gestion-auditoria-routing.module';
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
import { PlanAnualAuditoriaService } from 'src/app/services/plan-anual-auditoria.service';
import { RevisionSecretarioComponent } from './modules/programacion/revision-secretario/revision-secretario.component';
import { PdfVisualizadorComponent } from './modules/programacion/revision-jefe/pdf-visualizador/pdf-visualizador.component';
import { RevisionJefeComponent } from './modules/programacion/revision-jefe/revision-jefe.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ModalMotivosRechazoComponent } from './modules/programacion/revision-jefe/modal-motivos-rechazo/modal-motivos-rechazo.component';

@NgModule({
  declarations: [
    AppComponent,
    GestionAuditoriaComponent,
    RegistrarPlanComponent,
    FormularioDinamicoComponent,
    RevisionSecretarioComponent,
    PdfVisualizadorComponent,
    RevisionJefeComponent,
    PdfVisualizadorComponent,
    ModalMotivosRechazoComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    GestionAuditoriaModule,
    ConsultaPlanAnualAuditoriaModule,
    AsignacionAuditoresModule,
    AuditoriasEspecialesModule,
    FormularioAuditoriaEspecialModule,
    RegistrarAuditoriasModule,
    CommonModule,
    CargarArchivoModule,
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
    PdfViewerModule,
  ],
  providers: [PlanAnualAuditoriaService],
  bootstrap: [AppComponent],
})
export class AppModule {}
