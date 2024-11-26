import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { ProgramacionRoutingModule } from "./programacion-routing.module";
import { MaterialModule } from "src/app/shared/modules/material.module";
import { AsignacionAuditoresComponent } from "./components/asignacion-auditores/asignacion-auditores.component";
import { AuditoriasEspecialesComponent } from "./components/auditorias-especiales/auditorias-especiales.component";
import { ConsultaPlanAnualAuditoriaComponent } from "./components/consulta-plan-anual-auditoria/consulta-plan-anual-auditoria.component";
import { EditarAuditoriaComponent } from "./components/editar-auditoria/editar-auditoria.component";
import { RegistrarAuditoriasComponent } from "./components/registrar-auditorias/registrar-auditorias.component";
import { RegistrarPlanComponent } from "./components/registrar-plan/registrar-plan.component";
import { RevisionJefeComponent } from "./components/revision-jefe/revision-jefe.component";
import { RevisionSecretarioComponent } from "./components/revision-secretario/revision-secretario.component";
import { FormularioAuditoriaEspecialComponent } from "./components/auditorias-especiales/formulario-auditoria-especial/formulario-auditoria-especial.component";
import { ActividadesAuditoriaComponent } from "./components/editar-auditoria/actividades-auditoria/actividades-auditoria.component";
import { DocumentosAnexosAuditoriaComponent } from "./components/editar-auditoria/documentos-anexos-auditoria/documentos-anexos-auditoria.component";
import { AddAuditoriaModalComponent } from "./components/registrar-auditorias/add-auditoria-modal/add-auditoria-modal.component";
import { ModalMotivosRechazoComponent } from "./components/revision-jefe/modal-motivos-rechazo/modal-motivos-rechazo.component";
import { ModalAprobacionSecretarioComponent } from "./components/revision-secretario/modal-aprobacion-secretario/modal-aprobacion-secretario.component";
import { SharedModule } from "src/app/shared/shared.module";
import { PdfVisualizadorComponent } from "./components/revision-jefe/pdf-visualizador/pdf-visualizador.component";
import { ModalPdfVisualizadorComponent } from "./components/registrar-auditorias/pdf-visualizador-modal/pdf-visualizador.component";

@NgModule({
  declarations: [
    AddAuditoriaModalComponent,
    ActividadesAuditoriaComponent,
    AsignacionAuditoresComponent,
    AuditoriasEspecialesComponent,
    ConsultaPlanAnualAuditoriaComponent,
    DocumentosAnexosAuditoriaComponent,
    EditarAuditoriaComponent,
    FormularioAuditoriaEspecialComponent,
    ModalAprobacionSecretarioComponent,
    ModalMotivosRechazoComponent,
    PdfVisualizadorComponent,
    ModalPdfVisualizadorComponent,
    RegistrarAuditoriasComponent,
    RegistrarPlanComponent,
    RevisionJefeComponent,
    RevisionSecretarioComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    ProgramacionRoutingModule,
    MaterialModule,
  ],
})
export class ProgramacionModule {}
