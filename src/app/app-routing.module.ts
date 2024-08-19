import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GestionAuditoriaComponent } from './modules/gestion-auditoria/gestion-auditoria.component';

const routes: Routes = [
  {
    path:"gestion-auditoria",
    component: GestionAuditoriaComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }