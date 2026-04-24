import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { environment } from "src/environments/environment";
import { forkJoin } from "rxjs";

@Component({
  selector: "app-modal-lista-rechazos",
  templateUrl: "./modal-lista-rechazos.component.html",
  styleUrl: "./modal-lista-rechazos.component.css",
})
export class ModalListaRechazosComponent implements OnInit {
  rechazos: any[] = [];
  revisionesJefe: any[] = [];
  numRechazos: number = 0;
  cargando: boolean = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) private planAuditoria: any,
    private planAuditoriaMid: PlanAnualAuditoriaMid
  ) {}

  ngOnInit(): void {
    this.numRechazos = this.planAuditoria.numRechazos ?? 1;
    this.cargarObservaciones();
  }

  cargarObservaciones() {
    const planId = this.planAuditoria.id;
    const estadoRechazadoId = environment.PLAN_ESTADO.RECHAZADO;
    const estadoRevisionJefeId = environment.PLAN_ESTADO.EN_REVISION_JEFE_ID;

    const rechazos$ = this.planAuditoriaMid.get(
      `plan-estado?query=plan_auditoria_id:${planId},estado_id:${estadoRechazadoId},activo:true&limit=0&sortby=fecha_ejecucion_estado&order=desc`
    );

    const revisionesJefe$ = this.planAuditoriaMid.get(
      `plan-estado?query=plan_auditoria_id:${planId},estado_id:${estadoRevisionJefeId},activo:true&limit=0&sortby=fecha_ejecucion_estado&order=desc`
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
        this.cargando = false;
      }
    });
  }
}