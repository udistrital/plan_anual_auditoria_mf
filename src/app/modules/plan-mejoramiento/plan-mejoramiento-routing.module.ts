import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlanDeMejoramientoComponent } from './components/plan-de-mejoramiento/plan-mejoramiento.component';
import { RegistrarPlanComponent } from './components/plan-de-mejoramiento/ tabla-plan-mejoramiento/registrar-plan/registrar-plan.component';

const routes: Routes = [
  {
    path: '',
    component: PlanDeMejoramientoComponent,
  },
  {
    path: 'registrar-plan/:id',
    component: RegistrarPlanComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlanesRoutingModule {}