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
import { ActividadFormularioComponent as ActividadAuditoriaFormularioComponent } from "./components/auditorias-internas/editar-auditoria/actividades-auditoria/actividad-formulario/actividad-formulario.component";
import { CrearActividadComponent as CrearActividadAuditoriaComponent } from "./components/auditorias-internas/editar-auditoria/actividades-auditoria/crear-actividad/crear-actividad.component";
import { EditarActividadComponent as EditarActividadAuditoriaComponent } from "./components/auditorias-internas/editar-auditoria/actividades-auditoria/editar-actividad/editar-actividad.component";
import { RevisionDocumentosComponent } from "./components/auditorias-internas/revision-documentos/revision-documentos.component";
import { ModalRechazoAuditoriaComponent } from "./components/auditorias-internas/revision-documentos/modal-rechazo-auditoria/modal-rechazo-auditoria.component";

// Seguimiento e Informes
import { SeguimientoComponent } from "./components/seguimiento/seguimiento.component";
import { TablaSeguimientoComponent } from "./components/seguimiento/tabla-seguimiento/tabla-seguimiento.component";
import { EditarSeguimientoComponent } from "./components/seguimiento/editar-seguimiento/editar-seguimiento.component";
import { ActividadesSeguimientoComponent } from "./components/seguimiento/editar-seguimiento/actividades-seguimiento/actividades-seguimiento.component";
import { ActividadSeguimientoFormularioComponent } from "./components/seguimiento/editar-seguimiento/actividades-seguimiento/actividad-formulario/actividad-formulario.component";
import { CrearActividadSeguimientoComponent } from "./components/seguimiento/editar-seguimiento/actividades-seguimiento/crear-actividad/crear-actividad.component";
import { EditarActividadSeguimientoComponent } from "./components/seguimiento/editar-seguimiento/actividades-seguimiento/editar-actividad/editar-actividad.component";
import { DocumentosAnexosSeguimientoComponent } from "./components/seguimiento/editar-seguimiento/documentos-anexos-seguimiento/documentos-anexos-seguimiento.component";
import { RevisionDocumentosSeguimientoComponent } from "./components/seguimiento/revision-documentos/revision-documentos.component";
import { ModalRechazoSeguimientoComponent } from "./components/seguimiento/revision-documentos/modal-rechazo-seguimiento/modal-rechazo-seguimiento.component";
import { ModalVisualizarRecargarCompromisoEticoComponent } from "./components/auditorias-internas/editar-auditoria/documentos-anexos-auditoria/modal-visualizar-recargar-compromiso-etico/modal-visualizar-recargar-compromiso-etico.component";

@NgModule({
  declarations: [
    // Auditorias Internas
    ActividadesAuditoriaComponent,
    AuditoriasInternasComponent,
    DocumentosAnexosAuditoriaComponent,
    EditarAuditoriaComponent,
    TablaAuditoriasInternasComponent,
    ActividadAuditoriaFormularioComponent,
    CrearActividadAuditoriaComponent,
    EditarActividadAuditoriaComponent,
    RevisionDocumentosComponent,
    ModalRechazoAuditoriaComponent,
    ModalVisualizarRecargarCompromisoEticoComponent,

    // Seguimiento e Informes
    SeguimientoComponent,
    TablaSeguimientoComponent,
    EditarSeguimientoComponent,
    ActividadesSeguimientoComponent,
    ActividadSeguimientoFormularioComponent,
    CrearActividadSeguimientoComponent,
    EditarActividadSeguimientoComponent,
    DocumentosAnexosSeguimientoComponent,
    RevisionDocumentosSeguimientoComponent,
    ModalRechazoSeguimientoComponent
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
