import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GestionAuditoriaModule } from './modules/gestion-auditoria/gestion-auditoria.module';
import { ConsultaPlanAnualAuditoriaModule } from './modules/consulta-plan-anual-auditoria/consulta-plan-anual-auditoria.module';
import { RevisionPlanAuditoriaModule } from './modules/revision-plan-auditoria/revision-plan-auditoria.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    GestionAuditoriaModule,
    ConsultaPlanAnualAuditoriaModule,
    RevisionPlanAuditoriaModule,
    CommonModule

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
