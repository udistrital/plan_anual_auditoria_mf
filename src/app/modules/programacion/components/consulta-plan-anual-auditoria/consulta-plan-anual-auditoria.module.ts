import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ConsultaPlanAnualAuditoriaComponent } from "./consulta-plan-anual-auditoria.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MatTableModule } from "@angular/material/table";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatInputModule } from "@angular/material/input";
import { MatDividerModule } from "@angular/material/divider";
import { MatCardModule } from "@angular/material/card";

//Servicios
import { ParametrosService } from "src/app/core/services/parametros.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";

@NgModule({
  declarations: [ConsultaPlanAnualAuditoriaComponent],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatMenuModule,
    MatInputModule,
    MatDividerModule,
    MatCardModule,
  ],
  providers: [ParametrosService, PlanAnualAuditoriaService],
})
export class ConsultaPlanAnualAuditoriaModule {}
