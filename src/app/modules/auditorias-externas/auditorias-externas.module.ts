import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditoriasExternasComponent } from './components/auditorias-externas/auditorias-externas.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { AuditoriasExternasRoutingModule } from './auditorias-externas-routing.module';
import { MaterialModule } from 'src/app/shared/modules/material.module';
import { EditarAuditoriaComponent } from './components/auditorias-externas/editar-auditoria/editar-auditoria.component';
import { TablaAuditoriasExternasComponent } from './components/auditorias-externas/tabla-auditorias-externas/tabla-auditorias-externas.component';
import { ResumenHallazgosComponent } from './components/auditorias-externas/editar-auditoria/resumen-hallazgos/resumen-hallazgos.component';
import { HallazgosAuditoriaComponent } from './components/auditorias-externas/editar-auditoria/hallazgos-auditoria/hallazgos-auditoria.component';

@NgModule({
  declarations: [
    AuditoriasExternasComponent,
    EditarAuditoriaComponent,
    TablaAuditoriasExternasComponent,
    ResumenHallazgosComponent,
    HallazgosAuditoriaComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    AuditoriasExternasRoutingModule,
    MaterialModule,
  ]
})
export class AuditoriasExternasModule { }
