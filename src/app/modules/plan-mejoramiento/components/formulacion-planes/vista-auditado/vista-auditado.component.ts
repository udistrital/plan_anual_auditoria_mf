import { Component, OnInit } from "@angular/core";
import { environment } from "src/environments/environment";
import type {
  AuditoriaFormulacionPlan,
  ResumenFormulacionPlanes,
} from "src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models";
import { DatosFilaVista } from "../compartido/formulacion.utilidades";
import { VistaFormulacionBase } from "../compartido/vista-formulacion.base";
import {
  GrupoEstadoPlan,
  accionesHabilitadas,
  claseChipPorGrupo,
  columnasFormulacion,
  estadosDeGrupo,
  flujoPlan,
  grupoDeEstado,
  indicadoresFormulacion,
  opcionesEstadoPlan,
  textosAuditado,
} from "./vista-auditado.utilidades";

export type FilaFormulacion = AuditoriaFormulacionPlan & DatosFilaVista;

@Component({
  selector: "app-formulacion-vista-auditado",
  templateUrl: "../compartido/vista-formulacion.html",
  styleUrls: ["../compartido/formulacion-planes.css"],
  standalone: false,
})
export class VistaAuditadoComponent
  extends VistaFormulacionBase<AuditoriaFormulacionPlan, ResumenFormulacionPlanes, Exclude<GrupoEstadoPlan, "TODOS">>
  implements OnInit
{
  readonly textos = textosAuditado;
  readonly flujo = flujoPlan;
  readonly indicadores = indicadoresFormulacion;
  readonly opcionesEstadoPlan = opcionesEstadoPlan;
  readonly columnas = columnasFormulacion;
  readonly columnasIds = columnasFormulacion.map((c) => c.columnDef);
  protected readonly accionesHabilitadas = accionesHabilitadas;

  private cargoId = 0;

  override async ngOnInit(): Promise<void> {
    this.cargoId = this.rol === environment.ROL.JEFE_DEPENDENCIA
      ? environment.CARGO.JEFE_DEPENDENCIA_ID
      : environment.CARGO.ASISTENTE_DEPENDENCIA_ID;
    await super.ngOnInit();
  }

  protected get rutaBase(): string {
    return `plan-mejoramiento/formulacion/auditado/${this.personaId}/${this.cargoId}`;
  }

  protected estadosDeGrupo(grupo: GrupoEstadoPlan): number[] {
    return estadosDeGrupo(grupo);
  }

  protected claseEstado(estadoId: number): string {
    return claseChipPorGrupo[grupoDeEstado(estadoId)];
  }

  protected mapearFila(auditoria: AuditoriaFormulacionPlan): FilaFormulacion {
    return { ...auditoria, ...this.datosVista(auditoria) };
  }

  realizarAccion(fila: FilaFormulacion, accion: string): void {
    const acciones: Record<string, () => void> = {
      "Registrar Plan":    () => this.router.navigate([`/plan-mejoramiento/registrar-plan/${fila.auditoria_id}`]),
      "Ver Plan":          () => this.router.navigate([`/plan-mejoramiento/ver-plan/${fila.auditoria_id}`]),
      "Ver Observaciones": () => this.verObservaciones(fila),
    };
    acciones[accion]?.();
  }
}
