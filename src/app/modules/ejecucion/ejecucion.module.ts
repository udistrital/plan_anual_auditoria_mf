import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeguimientoInformesComponent } from './components/seguimiento-informes/seguimiento-informes.component';
import { AuditoriasInternasComponent } from './components/auditorias-internas/auditorias-internas.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { EjecucionRoutingModule } from './ejecucion-routing.module';
import { MaterialModule } from 'src/app/shared/modules/material.module';
import { EditarInformeComponent } from './components/auditorias-internas/editar-informe/editar-informe.component';
import { TablaAuditoriasInternasComponent } from './components/auditorias-internas/tabla-auditorias-internas/tabla-auditorias-internas.component';
import { AspectosEvaluadosComponent } from './components/auditorias-internas/editar-informe/aspectos-evaluados/aspectos-evaluados.component';
import { ResumenHallazgosComponent } from './components/auditorias-internas/editar-informe/resumen-hallazgos/resumen-hallazgos.component';
import { AspectosEvaluadosSeguimientoComponent } from './components/seguimiento-informes/editar-informe-seguimiento/aspectos-evaluados-seguimiento/aspectos-evaluados-seguimiento.component';
import { EditarInformeSeguimientoComponent } from './components/seguimiento-informes/editar-informe-seguimiento/editar-informe-seguimiento.component';
import { TablaSeguimientosComponent } from './components/seguimiento-informes/tabla-segumiento/tabla-seguimientos.component';
import { RevisionDocumentosEjecucionComponent } from './components/auditorias-internas/revision-documentos/revision-documentos.component';
import { ModalRechazoAuditoriaEjecucionComponent } from './components/auditorias-internas/revision-documentos/modal-rechazo-auditoria/modal-rechazo-auditoria.component';
import { RevisionDocumentosSeguimientoComponent } from './components/seguimiento-informes/revision-documentos-seguimiento/revision-documentos-seguimiento.component';
import { ModalRechazoSeguimientoComponent } from './components/seguimiento-informes/revision-documentos-seguimiento/modal-rechazo-seguimiento/modal-rechazo-seguimiento.component';

@NgModule({
  declarations: [
    SeguimientoInformesComponent,
    AuditoriasInternasComponent,
    EditarInformeComponent,
    TablaAuditoriasInternasComponent,
    AspectosEvaluadosComponent,
    ResumenHallazgosComponent,
    AspectosEvaluadosSeguimientoComponent,
    EditarInformeSeguimientoComponent,
    TablaSeguimientosComponent,
    RevisionDocumentosEjecucionComponent,
    ModalRechazoAuditoriaEjecucionComponent,
    RevisionDocumentosSeguimientoComponent,
    ModalRechazoSeguimientoComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    EjecucionRoutingModule,
    MaterialModule,
  ]
})
export class EjecucionModule { }
