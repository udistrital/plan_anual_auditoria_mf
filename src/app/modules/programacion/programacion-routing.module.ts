import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { BasesComponent } from "src/app/shared/components/bases/bases.component";
import { AsignarAuditoriasComponent } from "./components/asignar-auditorias/asignar-auditorias.component";
import { RegistroAuditoriasEspecialesComponent } from "./components/auditorias-especiales/registro-auditorias-especiales.component";
import { ConsultaPlanAuditoriaComponent } from "./components/consulta-plan-auditoria/consulta-plan-auditoria.component";
import { RegistrarPlanComponent } from "./components/consulta-plan-auditoria/registrar-plan/registrar-plan.component";
import { RevisionJefeComponent } from "./components/consulta-plan-auditoria/revision-jefe/revision-jefe.component";
import { RevisionSecretarioComponent } from "./components/consulta-plan-auditoria/revision-secretario/revision-secretario.component";
import { RegistrarAuditoriasComponent } from "./components/consulta-plan-auditoria/registrar-auditorias/registrar-auditorias.component";

const routes: Routes = [
  {
    path: "asignar-auditorias",
    component: AsignarAuditoriasComponent,
  },
  {
    path: "auditorias-especiales",
    component: RegistroAuditoriasEspecialesComponent,
  },
  {
    path: "registrar/:id",
    component: RegistrarAuditoriasComponent,
  },
  {
    path: "plan-auditoria",
    component: ConsultaPlanAuditoriaComponent,
  },
  {
    path: "plan-auditoria",
    children: [
      {
        path: "registrar-auditorias/:id",
        component: RegistrarAuditoriasComponent,
      },
      {
        path: "editar/:id",
        component: RegistrarPlanComponent,
      },
      {
        path: "revision-jefe/:id",
        component: RevisionJefeComponent,
      },
      {
        path: "revision-secretario/:id",
        component: RevisionSecretarioComponent,
      },
    ],
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
