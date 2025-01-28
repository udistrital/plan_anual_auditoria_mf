import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { PlaneacionRoutingModule } from "./planeacion-routing.module";
import { AuditoriasInternasComponent } from "./components/auditorias-internas/auditorias-internas.component";
import { MaterialModule } from "src/app/shared/modules/material.module";
import { ReactiveFormsModule } from "@angular/forms";
import { TablaAuditoriasInternasComponent } from "./components/auditorias-internas/tabla-auditorias-internas/tabla-auditorias-internas.component";
import { EditarAuditoriaComponent } from "./components/auditorias-internas/editar-auditoria/editar-auditoria.component";
import { SharedModule } from "src/app/shared/shared.module";
import { DocumentosAnexosAuditoriaComponent } from "./components/auditorias-internas/editar-auditoria/documentos-anexos-auditoria/documentos-anexos-auditoria.component";
import { ActividadesAuditoriaComponent } from "./components/auditorias-internas/editar-auditoria/actividades-auditoria/actividades-auditoria.component";
import { ActividadFormularioComponent } from "./components/auditorias-internas/editar-auditoria/actividades-auditoria/actividad-formulario/actividad-formulario.component";
import { CrearActividadComponent } from "./components/auditorias-internas/editar-auditoria/actividades-auditoria/crear-actividad/crear-actividad.component";
import { EditarActividadComponent } from "./components/auditorias-internas/editar-auditoria/actividades-auditoria/editar-actividad/editar-actividad.component";
import { RevisionDocumentosComponent } from "./components/auditorias-internas/revision-documentos/revision-documentos.component";
import { ModalRechazoAuditoriaComponent } from "./components/auditorias-internas/revision-documentos/modal-rechazo-auditoria/modal-rechazo-auditoria.component";

@NgModule({
  declarations: [
    ActividadesAuditoriaComponent,
    AuditoriasInternasComponent,
    DocumentosAnexosAuditoriaComponent,
    EditarAuditoriaComponent,
    TablaAuditoriasInternasComponent,
    ActividadFormularioComponent,
    CrearActividadComponent,
    EditarActividadComponent,
    RevisionDocumentosComponent,
    ModalRechazoAuditoriaComponent,
  ],
  imports: [
    CommonModule,
    PlaneacionRoutingModule,
    MaterialModule,
    ReactiveFormsModule,
    SharedModule
  ],
})
export class PlaneacionModule {}
