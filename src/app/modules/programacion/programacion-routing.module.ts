import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { BasesComponent } from "src/app/shared/components/bases/bases.component";
import { AsignacionAuditoresComponent } from "./components/asignacion-auditores/asignacion-auditores.component";
import { AuditoriasEspecialesComponent } from "./components/auditorias-especiales/auditorias-especiales.component";
import { ConsultaPlanAnualAuditoriaComponent } from "./components/consulta-plan-anual-auditoria/consulta-plan-anual-auditoria.component";
import { EditarAuditoriaComponent } from "./components/editar-auditoria/editar-auditoria.component";
import { RegistrarAuditoriasComponent } from "./components/registrar-auditorias/registrar-auditorias.component";
import { RegistrarPlanComponent } from "./components/registrar-plan/registrar-plan.component";
import { RevisionJefeComponent } from "./components/revision-jefe/revision-jefe.component";
import { RevisionSecretarioComponent } from "./components/revision-secretario/revision-secretario.component";

const routes: Routes = [
  {
    path: "consultar-plan",
    component: ConsultaPlanAnualAuditoriaComponent,
  },
  {
    path: "editar-auditoria",
    component: EditarAuditoriaComponent,
  },
  {
    path: "registrar-auditorias/:id",
    component: RegistrarAuditoriasComponent,
  },
  {
    path: "registrar-plan/:id",
    component: RegistrarPlanComponent,
  },
  {
    path: "revision-jefe",
    component: RevisionJefeComponent,
  },
  {
    path: "revision-secretario",
    component: RevisionSecretarioComponent,
  },
  {
    path: "asignacion-auditor",
    component: AsignacionAuditoresComponent,
  },
  {
    path: "auditorias-especiales",
    component: AuditoriasEspecialesComponent,
  },
  {
    path: "bases",
    component: BasesComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProgramacionRoutingModule {}
