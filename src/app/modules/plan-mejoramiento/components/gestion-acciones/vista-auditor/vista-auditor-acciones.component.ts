import { Component } from "@angular/core";
import type { AccionGestion } from "src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models";
import { VistaGestionBase } from "../compartido/vista-gestion.base";
import {
  BotonFila,
  botonAuditor,
  rolesVenTodasAcciones,
  textosAuditorGestion,
} from "../compartido/gestion-acciones.utilidades";

@Component({
  selector: "app-gestion-vista-auditor",
  templateUrl: "../compartido/vista-gestion.html",
  styleUrls: ["../../formulacion-planes/compartido/formulacion-planes.css", "../compartido/gestion-acciones.css"],
  standalone: false,
})
export class VistaAuditorAccionesComponent extends VistaGestionBase {
  readonly textos = textosAuditorGestion;

  protected get rutaBase(): string {
    return `gestion-accion/auditor/${this.personaId}`;
  }

  protected override paramsExtra(): Record<string, string> {
    return { alcance: rolesVenTodasAcciones.includes(this.rol) ? "todas" : "asignadas" };
  }

  botonDe(fila: AccionGestion): BotonFila {
    return botonAuditor(fila);
  }
}
