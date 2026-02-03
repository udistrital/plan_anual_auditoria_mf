import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlanDeMejoramientoComponent } from './components/plan-de-mejoramiento/plan-mejoramiento.component';

const routes: Routes = [
  {
    path: 'plan-mejoramiento',
    component: PlanDeMejoramientoComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlanesRoutingModule { }