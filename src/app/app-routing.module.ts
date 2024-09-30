import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GestionAuditoriaComponent } from './modules/gestion-auditoria/gestion-auditoria.component';
import { ConsultaPlanAnualAuditoriaComponent } from './modules/consulta-plan-anual-auditoria/consulta-plan-anual-auditoria.component';
import {RevisionPlanAuditoriaComponent}from "./modules/revision-plan-auditoria/revision-plan-auditoria.component"
import {AsignacionAuditoresComponent}from "./modules/asignacion-auditores/asignacion-auditores.component"
import { AuditoriasEspecialesComponent } from './modules/auditorias-especiales/auditorias-especiales.component';
import { EditarActividadesComponent } from './modules/editar-actividades/editar-actividades.component';

import { APP_BASE_HREF } from '@angular/common';

const routes: Routes = [
  {
    path:"gestion-auditoria",
    component: GestionAuditoriaComponent
  },
  {
    path: 'consultar-plan',  
    component: ConsultaPlanAnualAuditoriaComponent
  },
  {
    path: 'editar-actividades/:id',  
    component: EditarActividadesComponent
  },
  {
    path:"revision-plan",
    component: RevisionPlanAuditoriaComponent
  },
  {
    path:"asignacion-auditor",
    component: AsignacionAuditoresComponent
  },
  {
    path: "auditorias-especiales",
    component: AuditoriasEspecialesComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [{ provide: APP_BASE_HREF, useValue: "/plan-auditoria/"}]
})
export class AppRoutingModule { }