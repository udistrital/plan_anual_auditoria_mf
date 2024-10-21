import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GestionAuditoriaModule } from './modules/gestion-auditoria/gestion-auditoria.module';
import { ConsultaPlanAnualAuditoriaModule } from './modules/consulta-plan-anual-auditoria/consulta-plan-anual-auditoria.module';
import { RevisionPlanAuditoriaModule } from './modules/revision-plan-auditoria/revision-plan-auditoria.module';
import { AsignacionAuditoresModule } from './modules/asignacion-auditores/asignacion-auditores.module'
import { AuditoriasEspecialesModule } from './modules/auditorias-especiales/auditorias-especiales.module';
import { FormularioAuditoriaEspecialModule } from './modules/formulario-auditoria-especial/formulario-auditoria-especial.module';
import { EditarActividadesModule } from './modules/editar-actividades/editar-actividades.module';
import { CargarArchivoModule } from './modules/cargar-archivo/cargar-archivo.module';





@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    GestionAuditoriaModule,
    ConsultaPlanAnualAuditoriaModule,
    RevisionPlanAuditoriaModule,
    AsignacionAuditoresModule,
    AuditoriasEspecialesModule,
    FormularioAuditoriaEspecialModule,
    EditarActividadesModule,
    CommonModule,
    CargarArchivoModule,

    
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
