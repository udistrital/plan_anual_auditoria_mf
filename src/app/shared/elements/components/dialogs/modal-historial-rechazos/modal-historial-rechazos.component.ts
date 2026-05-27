import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { environment } from "src/environments/environment";
import { forkJoin } from "rxjs";

interface HistorialRechazosData {
  auditoriaId: string;
  estadoIds: number[];
  tipoEntidad?: "auditoria" | "plan";
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
  rechazos: any[] = [];
  revisionesJefe: any[] = [];
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
    const { auditoriaId, estadoIds, tipoEntidad = "auditoria" } = this.data;
    const estadoQuery = estadoIds.join("|");
    const isPlan = tipoEntidad === "plan";
    const baseUrl = isPlan ? "plan-estado" : "auditoria-estado";
    const estadoRevisionJefeId = isPlan
      ? environment.PLAN_ESTADO.EN_REVISION_JEFE_ID
      : environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE;

    const entityIdQueryName = isPlan ? "plan_auditoria_id" : "auditoria_id";

    const rechazos$ = this.planAuditoriaMid.get(
      `${baseUrl}?query=${entityIdQueryName}:${auditoriaId},estado_id__in:${estadoQuery},activo:true&limit=0&sortby=fecha_ejecucion_estado&order=desc`
    );

    const revisionesJefe$ = this.planAuditoriaMid.get(
      `${baseUrl}?query=${entityIdQueryName}:${auditoriaId},estado_id:${estadoRevisionJefeId},activo:true&limit=0&sortby=fecha_ejecucion_estado&order=desc`
    );

    forkJoin([rechazos$, revisionesJefe$]).subscribe({
      next: ([resRechazos, resRevisiones]) => {
        this.rechazos = resRechazos?.Data ?? [];
        // Solo mostrar revisiones del jefe que tengan observación no vacía
        this.revisionesJefe = (resRevisiones?.Data ?? []).filter(
          (r: any) => r.observacion && r.observacion.trim() !== ""
        );
        this.cargando = false;
      },
      error: () => {
        this.rechazos = [];
        this.revisionesJefe = [];
        this.cargando = false;
      },
    });
  }
}
