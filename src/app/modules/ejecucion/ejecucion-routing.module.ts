import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuditoriasExternasComponent } from "./components/auditorias-externas/auditorias-externas.component";
import { AuditoriasInternasComponent } from "./components/auditorias-internas/auditorias-internas.component";
import { SeguimientoInformesComponent } from "./components/seguimiento-informes/seguimiento-informes.component";
import { EditarInformeComponent } from "./components/auditorias-internas/editar-informe/editar-informe.component";

const routes: Routes = [
  {
    path: "auditorias-externas",
    component: AuditoriasExternasComponent,
  },
  { path: "", component: AuditoriasInternasComponent },
  { path: "auditorias-internas", component: AuditoriasInternasComponent },
  {
    path: "auditorias-internas",
    children: [
      {
        path: "editar-informe/:id",
        component: EditarInformeComponent,
      },
    ],
  },
  {
    path: "seguimiento-informes",
    component: SeguimientoInformesComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EjecucionRoutingModule { }