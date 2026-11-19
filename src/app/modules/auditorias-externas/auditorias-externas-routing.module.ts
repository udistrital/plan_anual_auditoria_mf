import { NgModule } from "@angular/core";
import { CanDeactivateFn, RouterModule, Routes } from "@angular/router";
import { AuditoriasExternasComponent } from "./components/auditorias-externas/auditorias-externas.component";
import { EditarAuditoriaComponent } from "./components/auditorias-externas/editar-auditoria/editar-auditoria.component";

/** Pregunta antes de abandonar un registro con información sin guardar. */
const salirSinPerderDatos: CanDeactivateFn<EditarAuditoriaComponent> = (componente) =>
  componente.puedeSalir();

const routes: Routes = [
  {
    path: "",
    component: AuditoriasExternasComponent,
  },
  {
    path: "registrar-auditoria",
    component: EditarAuditoriaComponent,
    canDeactivate: [salirSinPerderDatos],
  },
  {
    path: "editar-auditoria/:id",
    component: EditarAuditoriaComponent,
    canDeactivate: [salirSinPerderDatos],
  },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuditoriasExternasRoutingModule { }
