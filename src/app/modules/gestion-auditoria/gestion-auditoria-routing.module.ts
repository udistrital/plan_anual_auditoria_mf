import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GestionAuditoriaComponent } from './gestion-auditoria.component';

const routes: Routes = [
  { path: '', component: GestionAuditoriaComponent } // Ruta principal para este módulo
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionAuditoriaRoutingModule { }