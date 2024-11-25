import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { PlaneacionRoutingModule } from "./planeacion-routing.module";
import { AuditoriasInternasComponent } from "./components/auditorias-internas/auditorias-internas.component";
import { MaterialModule } from "src/app/shared/modules/material.module";
import { ReactiveFormsModule } from "@angular/forms";
import { TablaAuditoriasInternasComponent } from "./components/auditorias-internas/tabla-auditorias-internas/tabla-auditorias-internas.component";

@NgModule({
  declarations: [AuditoriasInternasComponent, TablaAuditoriasInternasComponent],
  imports: [
    CommonModule,
    PlaneacionRoutingModule,
    MaterialModule,
    ReactiveFormsModule,
  ],
})
export class PlaneacionModule {}
