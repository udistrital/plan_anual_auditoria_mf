import { Component, OnInit } from "@angular/core";
import { RolService } from "src/app/core/services/rol.service";
import { VistaFormulacion, vistaPorRol } from "../formulacion-planes/formulacion-planes.component";

/** Elige la vista de Gestión de Acciones según el rol (misma tabla de roles que Formulación de Planes). */
@Component({
  selector: "app-gestion-acciones",
  templateUrl: "./gestion-acciones.component.html",
  standalone: false,
})
export class GestionAccionesComponent implements OnInit {
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
