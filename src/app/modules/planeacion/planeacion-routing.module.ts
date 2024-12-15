import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuditoriasInternasComponent } from "./components/auditorias-internas/auditorias-internas.component";
import { EditarAuditoriaComponent } from "./components/auditorias-internas/editar-auditoria/editar-auditoria.component";

const routes: Routes = [
  { path: "", component: AuditoriasInternasComponent },
  { path: "auditorias-internas", component: AuditoriasInternasComponent },
  {
    path: "auditorias-internas",
    children: [
      {
        path: "editar/:id",
        component: EditarAuditoriaComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlaneacionRoutingModule {}
