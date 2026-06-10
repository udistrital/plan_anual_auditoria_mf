import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";

export interface HistorialRechazosData {
  auditoriaId: string;
  estadoEndpoint: string;
  auditoriaIdReferencia: string;
  estadoRevisionIds: number[];
  estadoRechazoIds: number[];
  titulo?: string;
  descripcion?: string;
}

@Component({
  selector: "app-modal-historial-rechazos",
  templateUrl: "./modal-historial-rechazos.component.html",
  styleUrls: ["./modal-historial-rechazos.component.css"],
  standalone: false,
})
export class ModalHistorialRechazosComponent implements OnInit {
  observaciones: any[] = [];
  cargando = true;
  titulo: string;
  descripcion: string = "";

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly data: HistorialRechazosData,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid
  ) {
    this.titulo = data.titulo ?? "Historial de observaciones";
    this.descripcion = data.descripcion ?? "";
  }

  ngOnInit(): void {
    this.cargarRechazos();
  }

  cargarRechazos() {
    const estadoQuery = [
          ...this.data.estadoRevisionIds,
          ...this.data.estadoRechazoIds
        ].join("|");

    // Construyendo url para solicitud
    let url = `${this.data.estadoEndpoint}`;
    // Filtros para obtener tanto rechazos como revisiones del jefe activos
    url += `?query=${this.data.auditoriaIdReferencia}:${this.data.auditoriaId}` +
        `,estado_id__in:${estadoQuery}` +
        ",activo:true";
    // Obtener todos en una sola página, ordenados por fecha de ejecución descendente
    url += "&limit=0&sortby=fecha_ejecucion_estado&order=desc";

    this.planAuditoriaMid.get(url).subscribe({
      next: (res) => {
        const data = res?.Data ?? [];
        // Sólo mostrar rechazos o revisiones que tengan observación no vacía
        this.observaciones = data.filter((item: any) =>
          this.data.estadoRechazoIds.includes(item.estado_id)
          || item.observacion && item.observacion.trim() !== ""
        )
        this.cargando = false;
      },
      error: (err) => {
        console.error("Error al cargar historial de rechazos:", err);
        this.cargando = false;
      }
    });
  }

  isRechazo(observacion: any): boolean {
    return this.data.estadoRechazoIds.includes(observacion.estado.id);
  }
}
