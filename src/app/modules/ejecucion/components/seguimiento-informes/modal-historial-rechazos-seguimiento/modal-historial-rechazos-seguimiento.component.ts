import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-modal-historial-rechazos-seguimiento",
  templateUrl: "./modal-historial-rechazos-seguimiento.component.html",
  styleUrl: "./modal-historial-rechazos-seguimiento.component.css",
})
export class ModalHistorialRechazosSeguimientoComponent implements OnInit {
  rechazos: any[] = [];
  cargando = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: { auditoriaId: string },
    private planAuditoriaMid: PlanAnualAuditoriaMid
  ) {}

  ngOnInit(): void {
    this.cargarRechazos();
  }

  cargarRechazos() {
    const { auditoriaId } = this.data;
    const estadoRechazadoJefe =
      environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_INFORME_FINAL_JEFE;

    this.planAuditoriaMid
      .get(
        `auditoria-estado?query=auditoria_id:${auditoriaId},estado_id:${estadoRechazadoJefe},activo:true&limit=0&sortby=fecha_ejecucion_estado&order=desc`
      )
      .subscribe((res) => {
        this.rechazos = res.Data || [];
        this.cargando = false;
      });
  }
}
