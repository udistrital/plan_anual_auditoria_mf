import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuditoriasInternasComponent } from "./components/auditorias-internas/auditorias-internas.component";

const routes: Routes = [
  { path: "", component: AuditoriasInternasComponent },
  { path: "auditorias-internas", component: AuditoriasInternasComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlaneacionRoutingModule {}
