import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { PlanesRoutingModule } from './plan-mejoramiento-routing.module';
import { SharedModule } from '../../shared/shared.module';

import { PlanDeMejoramientoComponent } from './components/plan-de-mejoramiento/plan-mejoramiento.component';
import { TablaPlanMejoramientoComponent } from './components/plan-de-mejoramiento/ tabla-plan-mejoramiento/tabla-plan-mejoramiento.component';
import { ModalAsignacionAuditoresComponent } from './components/plan-de-mejoramiento/ tabla-plan-mejoramiento/modal-asignacion-auditores/modal-asignacion-auditores.component';
import { RegistrarPlanComponent } from './components/plan-de-mejoramiento/ tabla-plan-mejoramiento/registrar-plan/registrar-plan.component';
import { TablaHallazgosComponent } from './components/plan-de-mejoramiento/ tabla-plan-mejoramiento/registrar-plan/tabla-hallazgos/tabla-hallazgos.component';
import { ModalRegistrarAccionComponent } from './components/plan-de-mejoramiento/ tabla-plan-mejoramiento/registrar-plan/modal-registrar-accion/modal-registrar-accion.component';
import { ModalRechazoPlanComponent } from './components/plan-de-mejoramiento/ tabla-plan-mejoramiento/modal-rechazo-plan/modal-rechazo-plan.component';
import { ModalHistorialObservacionesComponent } from './components/plan-de-mejoramiento/ tabla-plan-mejoramiento/modal-historial-observaciones/modal-historial-observaciones.component';
import { VerPlanComponent } from './components/plan-de-mejoramiento/ver-plan/ver-plan.component';
import { MaterialModule } from 'src/app/shared/modules/material.module';
import { RegistroAvancesComponent } from './components/gestion-acciones/registro-avances/registro-avances.component';

@NgModule({
  declarations: [
    PlanDeMejoramientoComponent,
    TablaPlanMejoramientoComponent,
    ModalAsignacionAuditoresComponent,
    RegistrarPlanComponent,
    TablaHallazgosComponent,
    ModalRegistrarAccionComponent,
    RegistroAvancesComponent,
    ModalRechazoPlanComponent,
    ModalHistorialObservacionesComponent,
    VerPlanComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    PlanesRoutingModule,
    MaterialModule,
  ],
})
export class PlanesModule {}