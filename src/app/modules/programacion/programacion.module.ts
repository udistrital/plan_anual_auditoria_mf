import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { ProgramacionRoutingModule } from "./programacion-routing.module";
import { MaterialModule } from "src/app/shared/modules/material.module";
import { AsignarAuditoriasComponent } from "./components/asignar-auditorias/asignar-auditorias.component";
import { RegistroAuditoriasEspecialesComponent } from "./components/auditorias-especiales/registro-auditorias-especiales.component";
import { ConsultaPlanAuditoriaComponent } from "./components/consulta-plan-auditoria/consulta-plan-auditoria.component";
import { RegistrarPlanComponent } from "./components/consulta-plan-auditoria/registrar-plan/registrar-plan.component";
import { FormularioAuditoriaEspecialComponent } from "./components/auditorias-especiales/formulario-auditoria-especial/formulario-auditoria-especial.component";
import { SharedModule } from "src/app/shared/shared.module";
import { ModalAprobacionSecretarioComponent } from "./components/consulta-plan-auditoria/revision-secretario/modal-aprobacion-secretario/modal-aprobacion-secretario.component";
import { ModalMotivosRechazoComponent } from "./components/consulta-plan-auditoria/revision-jefe/modal-motivos-rechazo/modal-motivos-rechazo.component";
import { PdfVisualizadorComponent } from "./components/consulta-plan-auditoria/revision-jefe/pdf-visualizador/pdf-visualizador.component";
import { RevisionJefeComponent } from "./components/consulta-plan-auditoria/revision-jefe/revision-jefe.component";
import { RevisionSecretarioComponent } from "./components/consulta-plan-auditoria/revision-secretario/revision-secretario.component";
import { AddAuditoriaModalComponent } from "./components/consulta-plan-auditoria/registrar-auditorias/add-auditoria-modal/add-auditoria-modal.component";
import { ModalPdfVisualizadorComponent } from "./components/consulta-plan-auditoria/registrar-auditorias/pdf-visualizador-modal/pdf-visualizador.component";
import { RegistrarAuditoriasComponent } from "./components/consulta-plan-auditoria/registrar-auditorias/registrar-auditorias.component";
import { ModalAgregarAuditorComponent } from "./components/asignar-auditorias/modal-agregar-auditor/modal-agregar-auditor.component";

@NgModule({
  declarations: [
    AddAuditoriaModalComponent,
    AsignarAuditoriasComponent,
    ConsultaPlanAuditoriaComponent,
    FormularioAuditoriaEspecialComponent,
    ModalAgregarAuditorComponent,
    ModalAprobacionSecretarioComponent,
    ModalMotivosRechazoComponent,
    PdfVisualizadorComponent,
    ModalPdfVisualizadorComponent,
    RevisionJefeComponent,
    RevisionSecretarioComponent,
    RegistrarAuditoriasComponent,
    RegistrarPlanComponent,
    RegistroAuditoriasEspecialesComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    ProgramacionRoutingModule,
    MaterialModule,
  ],
})
export class ProgramacionModule {}
