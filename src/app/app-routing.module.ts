import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditarAuditoriaComponent } from './modules/programacion/editar-auditoria/editar-auditoria.component';
import { ConsultaPlanAnualAuditoriaComponent } from './modules/programacion/consulta-plan-anual-auditoria/consulta-plan-anual-auditoria.component';
import { RevisionJefeComponent } from './modules/programacion/revision-jefe/revision-jefe.component';
import { AsignacionAuditoresComponent } from './modules/programacion/asignacion-auditores/asignacion-auditores.component';
import { AuditoriasEspecialesComponent } from './modules/programacion/auditorias-especiales/auditorias-especiales.component';
import { RegistrarAuditoriasComponent } from './modules/programacion/registrar-auditorias/registrar-auditorias.component';
import { RegistrarPlanComponent } from './modules/programacion/registrar-plan/registrar-plan.component';

import { APP_BASE_HREF } from '@angular/common';
import { RevisionSecretarioComponent } from './modules/programacion/revision-secretario/revision-secretario.component';
import { BasesComponent } from './components/bases/bases.component';

const routes: Routes = [
  {
    path: 'consultar-plan',
    component: ConsultaPlanAnualAuditoriaComponent,
  },
  {
    path: 'editar-auditoria',
    component: EditarAuditoriaComponent,
  },
  {
    path: 'registrar-auditorias/:id',
    component: RegistrarAuditoriasComponent,
  },
  {
    path: 'registrar-plan/:id',
    component: RegistrarPlanComponent,
  },
  {
    path: 'revision-jefe',
    component: RevisionJefeComponent,
  },
  {
    path: 'revision-secretario',
    component: RevisionSecretarioComponent,
  },
  {
    path: 'asignacion-auditor',
    component: AsignacionAuditoresComponent,
  },
  {
    path: 'auditorias-especiales',
    component: AuditoriasEspecialesComponent,
  },
  {
    path: 'bases',
    component: BasesComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [{ provide: APP_BASE_HREF, useValue: '/plan-auditoria/' }],
})
export class AppRoutingModule {}
