import { Component, OnInit } from "@angular/core";
import { RolService } from "src/app/core/services/rol.service";
import { environment } from "src/environments/environment";

export type VistaFormulacion = "auditor" | "auditado";

/**
 * Vista que ve cada rol en Formulación de Planes, en orden de prioridad.
 * Los roles que no aparecen aquí ven la página en blanco hasta que se implemente su vista.
 */
export const vistaPorRol: Record<string, VistaFormulacion> = {
  [environment.ROL.JEFE]:                  "auditor",
  [environment.ROL.AUDITOR_EXPERTO]:       "auditor",
  [environment.ROL.AUDITOR]:               "auditor",
  [environment.ROL.AUDITOR_ASISTENTE]:     "auditor",
  [environment.ROL.JEFE_DEPENDENCIA]:      "auditado",
  [environment.ROL.ASISTENTE_DEPENDENCIA]: "auditado",
};

@Component({
  selector: "app-formulacion-planes",
  templateUrl: "./formulacion-planes.component.html",
  standalone: false,
})
export class FormulacionPlanesComponent implements OnInit {
  rol: string | null = null;
  vista: VistaFormulacion | null = null;

  constructor(private readonly rolService: RolService) {}

  async ngOnInit(): Promise<void> {
    // La ruta no tiene AuthGuard y AppComponent no espera la carga de roles
    await this.rolService.cargarRoles();
    this.rol = this.rolService.getRolPrioritario(Object.keys(vistaPorRol));
    this.vista = this.rol ? vistaPorRol[this.rol] : null;
  }
}
