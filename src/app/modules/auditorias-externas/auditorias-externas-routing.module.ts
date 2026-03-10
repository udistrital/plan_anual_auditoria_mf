import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuditoriasExternasComponent } from "./components/auditorias-externas/auditorias-externas.component";
import { EditarAuditoriaComponent } from "./components/auditorias-externas/editar-auditoria/editar-auditoria.component";

const routes: Routes = [
  {
    path: "",
    component: AuditoriasExternasComponent,
  },
  {
    path: "editar-auditoria/:id",
    component: EditarAuditoriaComponent,
  },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuditoriasExternasRoutingModule { }