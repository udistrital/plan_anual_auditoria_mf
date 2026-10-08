import { Component, OnInit } from "@angular/core";
import { environment } from "src/environments/environment";
import { ModalAsignacionAuditoresComponent } from "../../plan-de-mejoramiento/ tabla-plan-mejoramiento/modal-asignacion-auditores/modal-asignacion-auditores.component";
import type {
  AuditoriaFormulacionAuditor,
  ResumenFormulacionAuditor,
} from "src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models";
import { DatosFilaVista } from "../compartido/formulacion.utilidades";
import { VistaFormulacionBase } from "../compartido/vista-formulacion.base";
import {
  AlcanceAuditor,
  GrupoAuditor,
  GrupoEstadoAuditor,
  PlazoPlan,
  accionesHabilitadasAuditor,
  calcularPlazo,
  claseChipPorGrupoAuditor,
  columnasAuditor,
  estadosDeGrupo,
  flujoAuditor,
  grupoDeEstado,
  indicadoresAuditor,
  opcionesAlcanceAuditor,
  opcionesEstadoAuditor,
  rolesDictamen,
  rolesVenTodas,
  textosAuditor,
} from "./vista-auditor.utilidades";

export type FilaAuditor = AuditoriaFormulacionAuditor & DatosFilaVista & { plazo: PlazoPlan | null };

@Component({
  selector: "app-formulacion-vista-auditor",
  templateUrl: "../compartido/vista-formulacion.html",
  styleUrls: ["../compartido/formulacion-planes.css"],
  standalone: false,
})
export class VistaAuditorComponent
  extends VistaFormulacionBase<AuditoriaFormulacionAuditor, ResumenFormulacionAuditor, GrupoAuditor>
  implements OnInit
{
  readonly textos = textosAuditor;
  readonly flujo = flujoAuditor;
  readonly indicadores = indicadoresAuditor;
  readonly opcionesEstadoPlan = opcionesEstadoAuditor;
  readonly columnas = columnasAuditor;
  readonly columnasIds = columnasAuditor.map((c) => c.columnDef);
  protected readonly accionesHabilitadas = accionesHabilitadasAuditor;

  override alcance: AlcanceAuditor = "asignadas";

  override async ngOnInit(): Promise<void> {
    // AUDITOR y AUDITOR_ASISTENTE solo ven sus auditorías: sin selector
    this.opcionesAlcance = rolesVenTodas.includes(this.rol) ? opcionesAlcanceAuditor : [];
    await super.ngOnInit();
  }

  protected get rutaBase(): string {
    return `plan-mejoramiento/formulacion/auditor/${this.personaId}`;
  }

  protected override paramsExtra(): Record<string, string> {
    return { alcance: this.alcance };
  }

  protected estadosDeGrupo(grupo: GrupoEstadoAuditor): number[] {
    return estadosDeGrupo(grupo);
  }

  protected claseEstado(estadoId: number): string {
    return claseChipPorGrupoAuditor[grupoDeEstado(estadoId)];
  }

  protected mapearFila(auditoria: AuditoriaFormulacionAuditor): FilaAuditor {
    const datos = this.datosVista(auditoria);
    // En revisión, "Ver Plan" abre ver-plan con Aprobar/Rechazar para quien puede dictaminar
    const dictamina =
      auditoria.estado_plan_id === environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.REVISION_PLAN_MEJORAMIENTO_AUDITOR &&
      rolesDictamen.includes(this.rol);

    return {
      ...auditoria,
      ...datos,
      acciones: dictamina ? datos.acciones.map((a) => (a === "Ver Plan" ? "Dictaminar Plan" : a)) : datos.acciones,
      plazo: calcularPlazo(auditoria),
    };
  }

  protected override columnasExportacion(a: AuditoriaFormulacionAuditor): Record<string, unknown> {
    return {
      ...super.columnasExportacion(a),
      "Acciones aprobadas": a.acciones_aprobadas,
      "Total acciones": a.total_acciones,
      "Asignada": a.asignada ? "Sí" : "No",
    };
  }

  realizarAccion(fila: FilaAuditor, accion: string): void {
    const verPlan = () => this.router.navigate([`/plan-mejoramiento/ver-plan/${fila.auditoria_id}`]);
    const acciones: Record<string, () => void> = {
      "Ver Plan":            verPlan,
      "Dictaminar Plan":     verPlan,
      "Ver Observaciones":   () => this.verObservaciones(fila),
      "Asignar Auditor(es)": () => this.asignarAuditores(fila),
    };
    acciones[accion]?.();
  }

  /** Reutiliza el modal de la tabla de planes con la forma de datos que espera. */
  private asignarAuditores(fila: FilaAuditor): void {
    const dialogRef = this.dialog.open(ModalAsignacionAuditoresComponent, {
      width: "1100px",
      data: {
        auditoria: {
          _id: fila.auditoria_id,
          titulo: fila.titulo,
          fecha_inicio: fila.fecha_inicio,
          fecha_fin: fila.fecha_fin,
          auditores: fila.auditores_auditoria.map((auditor_nombre) => ({ auditor_nombre })),
          planMejoramientoId: fila.plan_mejoramiento_id,
        },
        usuarioId: this.personaId,
        role: this.rol,
      },
    });
    dialogRef.afterClosed().subscribe((guardado: boolean) => {
      if (guardado) this.recargar();
    });
  }
}
