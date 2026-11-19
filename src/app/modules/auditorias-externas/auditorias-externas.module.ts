import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditoriasExternasComponent } from './components/auditorias-externas/auditorias-externas.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { AuditoriasExternasRoutingModule } from './auditorias-externas-routing.module';
import { MaterialModule } from 'src/app/shared/modules/material.module';
import { EditarAuditoriaComponent } from './components/auditorias-externas/editar-auditoria/editar-auditoria.component';
import { TablaAuditoriasExternasComponent } from './components/auditorias-externas/tabla-auditorias-externas/tabla-auditorias-externas.component';
import { HallazgosAuditoriaComponent } from './components/auditorias-externas/editar-auditoria/hallazgos-auditoria/hallazgos-auditoria.component';
import { ModalVisualizarRecargarInformeAuditoriaComponent } from './components/auditorias-externas/editar-auditoria/modal-visualizar-recargar-informe-auditoria/modal-visualizar-recargar-informe-auditoria.component';
import { ModalCargueHallazgosExternosComponent } from './components/auditorias-externas/editar-auditoria/modal-cargue-hallazgos-externos/modal-cargue-hallazgos-externos.component';
import { ModalHallazgoExternoComponent } from './components/auditorias-externas/editar-auditoria/modal-hallazgo-externo/modal-hallazgo-externo.component';

@NgModule({
  declarations: [
    AuditoriasExternasComponent,
    EditarAuditoriaComponent,
    TablaAuditoriasExternasComponent,
    HallazgosAuditoriaComponent,
    ModalVisualizarRecargarInformeAuditoriaComponent,
    ModalHallazgoExternoComponent,
    ModalCargueHallazgosExternosComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    AuditoriasExternasRoutingModule,
    MaterialModule,
  ]
})
export class AuditoriasExternasModule { }
