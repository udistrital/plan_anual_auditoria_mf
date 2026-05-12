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
import { MaterialModule } from 'src/app/shared/modules/material.module';

@NgModule({
  declarations: [
    PlanDeMejoramientoComponent,
    TablaPlanMejoramientoComponent,
    ModalAsignacionAuditoresComponent,
    RegistrarPlanComponent,
    TablaHallazgosComponent,
    ModalRegistrarAccionComponent,
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