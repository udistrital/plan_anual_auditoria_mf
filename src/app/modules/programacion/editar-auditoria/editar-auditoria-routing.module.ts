import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditarAuditoriaComponent } from './editar-auditoria.component';

const routes: Routes = [
  { path: '', component: EditarAuditoriaComponent } // Ruta principal para este módulo
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EditarAuditoriaRoutingModule { }