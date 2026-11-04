import { Component, OnInit } from "@angular/core";
import { environment } from "src/environments/environment";
import type { AccionGestion } from "src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models";
import { VistaGestionBase } from "../compartido/vista-gestion.base";
import { BotonFila, botonAuditado, textosAuditadoGestion } from "../compartido/gestion-acciones.utilidades";

@Component({
  selector: "app-gestion-vista-auditado",
  templateUrl: "../compartido/vista-gestion.html",
  styleUrls: ["../../formulacion-planes/compartido/formulacion-planes.css", "../compartido/gestion-acciones.css"],
  standalone: false,
})
export class VistaAuditadoAccionesComponent extends VistaGestionBase implements OnInit {
  readonly textos = textosAuditadoGestion;
  private cargoId = 0;

  override async ngOnInit(): Promise<void> {
    this.cargoId = this.rol === environment.ROL.JEFE_DEPENDENCIA
      ? environment.CARGO.JEFE_DEPENDENCIA_ID
      : environment.CARGO.ASISTENTE_DEPENDENCIA_ID;
    await super.ngOnInit();
  }

  protected get rutaBase(): string {
    return `gestion-accion/auditado/${this.personaId}/${this.cargoId}`;
  }

  botonDe(fila: AccionGestion): BotonFila {
    return botonAuditado(fila);
  }
}
