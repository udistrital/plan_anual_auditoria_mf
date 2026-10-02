import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";

export interface HistorialRechazosData {
  auditoriaId: string;
  estadoEndpoint: string;
  auditoriaIdReferencia: string;
  estadoRevisionIds?: number[];
  estadoRechazoIds?: number[];
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
    const queryParts = [`${this.data.auditoriaIdReferencia}:${this.data.auditoriaId}`];

    const estados = [
      ...(this.data.estadoRevisionIds ?? []),
      ...(this.data.estadoRechazoIds ?? []),
    ];

    if (estados.length > 0) {
      queryParts.push(`estado_id__in:${estados.join("|")}`);
    }

    queryParts.push("activo:true");

    const url = `${this.data.estadoEndpoint}?query=${queryParts.join(",")}` +
      "&limit=0&sortby=fecha_ejecucion_estado&order=desc";

    this.planAuditoriaMid.get(url).subscribe({
      next: (res) => {
        const data = res?.Data ?? [];

        if (estados.length > 0) {
          this.observaciones = data.filter((item: any) =>
            this.data.estadoRechazoIds?.includes(item.estado_id)
            || item.observacion && item.observacion.trim() !== ""
          );
        } else {
          this.observaciones = data;
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error("Error al cargar historial de rechazos:", err);
        this.cargando = false;
      }
    });
  }

  isRechazo(observacion: any): boolean {
    const estadoId = observacion.estado?.id ?? observacion.estado_id;
    return Boolean(this.data.estadoRechazoIds?.includes(estadoId));
  }
}
