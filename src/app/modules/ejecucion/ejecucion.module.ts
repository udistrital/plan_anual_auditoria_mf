import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditoriasExternasComponent } from './components/auditorias-externas/auditorias-externas.component';
import { SeguimientoInformesComponent } from './components/seguimiento-informes/seguimiento-informes.component';
import { AuditoriasInternasComponent } from './components/auditorias-internas/auditorias-internas.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { EjecucionRoutingModule } from './ejecucion-routing.module';
import { MaterialModule } from 'src/app/shared/modules/material.module';
import { EditarInformeComponent } from './components/auditorias-internas/editar-informe/editar-informe.component';
import { TablaAuditoriasInternasComponent } from './components/auditorias-internas/tabla-auditorias-internas/tabla-auditorias-internas.component';
import { AspectosGeneralesComponent } from './components/auditorias-internas/editar-informe/aspectos-generales/aspectos-generales.component';
import { AspectosEvaluadosComponent } from './components/auditorias-internas/editar-informe/aspectos-evaluados/aspectos-evaluados.component';
import { ResumenHallazgosComponent } from './components/auditorias-internas/editar-informe/resumen-hallazgos/resumen-hallazgos.component';


@NgModule({
  declarations: [
    AuditoriasExternasComponent,
    SeguimientoInformesComponent,
    AuditoriasInternasComponent,
    EditarInformeComponent,
    TablaAuditoriasInternasComponent,
    AspectosGeneralesComponent,
    AspectosEvaluadosComponent,
    ResumenHallazgosComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    EjecucionRoutingModule,
    MaterialModule,
  ]
})
export class EjecucionModule { }
