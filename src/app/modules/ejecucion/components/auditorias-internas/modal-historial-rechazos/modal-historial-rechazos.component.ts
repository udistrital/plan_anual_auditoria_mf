import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-modal-historial-rechazos",
  templateUrl: "./modal-historial-rechazos.component.html",
  styleUrl: "./modal-historial-rechazos.component.css",
})
export class ModalHistorialRechazosComponent implements OnInit {
  rechazos: any[] = [];
  cargando = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: { auditoriaId: string },
    private planAuditoriaMid: PlanAnualAuditoriaMid
  ) { }

  ngOnInit(): void {
    this.cargarRechazos();
  }

  cargarRechazos() {
    const { auditoriaId } = this.data;
    const estadoRechazadoJefe =
      environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_PREINFORME_JEFE;
    const estadoObservacionesAuditado =
      environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO;

    this.planAuditoriaMid
      .get(
        `auditoria-estado?query=auditoria_id:${auditoriaId},estado_id__in:${estadoRechazadoJefe}|${estadoObservacionesAuditado},activo:true&limit=0&sortby=fecha_ejecucion_estado&order=desc`
      )
      .subscribe((res) => {
        this.rechazos = (res.Data || []).map((r: any) => ({
          ...r,
          tipoRechazo:
            r.estado?.id === estadoRechazadoJefe
              ? "Rechazado por"
              : "Observaciones de",
          icono:
            r.estado?.id === estadoRechazadoJefe ? "cancel" : "rate_review",
        }));
        this.cargando = false;
      });
  }
}
