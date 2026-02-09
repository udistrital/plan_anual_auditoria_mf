import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuditoriasInternasComponent } from "./components/auditorias-internas/auditorias-internas.component";
import { SeguimientoInformesComponent } from "./components/seguimiento-informes/seguimiento-informes.component";
import { EditarInformeComponent } from "./components/auditorias-internas/editar-informe/editar-informe.component";
import { EditarInformeSeguimientoComponent } from "./components/seguimiento-informes/editar-informe-seguimiento/editar-informe-seguimiento.component";
import { RevisionDocumentosEjecucionComponent } from "./components/auditorias-internas/revision-documentos/revision-documentos.component";

const routes: Routes = [
  {
    path: "",
    component: AuditoriasInternasComponent,
  },
  {
    path: "auditorias-internas",
    component: AuditoriasInternasComponent,
  },
  {
    path: "auditorias-internas/editar-informe/:id",
    component: EditarInformeComponent,
  },
  {
    path: "auditorias-internas/revision/:id",
    component: RevisionDocumentosEjecucionComponent,
  },
  {
    path: "seguimiento-informes",
    component: SeguimientoInformesComponent,
  },
  {
    path: "seguimiento-informes/editar-informe/:id",
    component: EditarInformeSeguimientoComponent,
  },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EjecucionRoutingModule { }