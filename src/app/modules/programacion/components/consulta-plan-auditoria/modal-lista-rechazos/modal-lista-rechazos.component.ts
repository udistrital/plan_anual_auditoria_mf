import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-modal-lista-rechazos",
  templateUrl: "./modal-lista-rechazos.component.html",
  styleUrl: "./modal-lista-rechazos.component.css",
})
export class ModalListaRechazosComponent implements OnInit {
  rechazos: any[] = [];
  numRechazos: number = 0;
  constructor(
    @Inject(MAT_DIALOG_DATA) private planAuditoria: any,
    private planAuditoriaMid: PlanAnualAuditoriaMid
  ) {}

  ngOnInit(): void {
    this.numRechazos = this.planAuditoria.numRechazos;
    this.cargarRechazos();
  }

  cargarRechazos() {
    const planId = this.planAuditoria.id;
    const estadoRechazadoId = environment.PLAN_ESTADO.RECHAZADO;
    this.planAuditoriaMid
      .get(
        `plan-estado?query=plan_auditoria_id:${planId},estado_id:${estadoRechazadoId},activo:true&limit=0&sortby=fecha_ejecucion_estado&order=desc`
      )
      .subscribe((res) => {
        this.rechazos = res.Data;
      });
  }
}
