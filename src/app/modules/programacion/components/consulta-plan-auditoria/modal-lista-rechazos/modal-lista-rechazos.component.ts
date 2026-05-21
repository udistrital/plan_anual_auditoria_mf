import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { environment } from "src/environments/environment";

@Component({
    selector: "app-modal-lista-rechazos",
    templateUrl: "./modal-lista-rechazos.component.html",
    styleUrl: "./modal-lista-rechazos.component.css",
    standalone: false
})
export class ModalListaRechazosComponent implements OnInit {
  observaciones: any[] = [];
  numRechazos: number = 0;
  cargando: boolean = true;
  estadoRevision = environment.PLAN_ESTADO.EN_REVISION_JEFE_ID;
  estadoRechazo = environment.PLAN_ESTADO.RECHAZADO;

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly planAuditoria: any,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid
  ) {}

  ngOnInit(): void {
    this.numRechazos = this.planAuditoria.numRechazos ?? 1;
    this.cargarObservaciones();
  }

  cargarObservaciones() {
    const planId = this.planAuditoria.id;
    const estados = [this.estadoRevision, this.estadoRechazo].join("|");

    this.planAuditoriaMid.get(
      `plan-estado?query=plan_auditoria_id:${planId},estado_id__in:${estados},activo:true&limit=0&sortby=fecha_ejecucion_estado&order=desc`
    ).subscribe({
      next: (res) => {
        const data = res?.Data ?? [];
        // Sólo mostrar revisiones del jefe que tengan observación no vacía
        this.observaciones = data.filter((item: any) =>
          item.estado.id === this.estadoRechazo
          || item.observacion && item.observacion.trim() !== ""
        );
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }
}
