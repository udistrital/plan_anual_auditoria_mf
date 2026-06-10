import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlanDeMejoramientoComponent } from './components/plan-de-mejoramiento/plan-mejoramiento.component';
import { RegistrarPlanComponent } from './components/plan-de-mejoramiento/ tabla-plan-mejoramiento/registrar-plan/registrar-plan.component';
import { VerPlanComponent } from './components/plan-de-mejoramiento/ver-plan/ver-plan.component';
import { GestionAccionesComponent } from './components/gestion-acciones/gestion-acciones.component';

const routes: Routes = [
  {
    path: '',
    component: PlanDeMejoramientoComponent,
    data: { accionesPermitidas: ['Registrar Plan', 'Enviar a Revisión', 'Ver Plan', 'Aprobar Plan', 'Rechazar Plan', 'Ver Documentos Auditoría', 'Ver Observaciones'] },
  },
  {
    path: 'asignar-auditores',
    component: PlanDeMejoramientoComponent,
    data: { accionesPermitidas: ['Asignar Auditor(es)'] },
  },
  {
    path: 'registrar-plan/:id',
    component: RegistrarPlanComponent,
  },
  {
    path: 'ver-plan/:id',
    component: VerPlanComponent,
  },
  {
    path: 'gestion-acciones',
    component: GestionAccionesComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlanesRoutingModule {}