import { Injectable } from "@angular/core";
import { ImplicitAutenticationService } from "./implicit_autentication.service";
import { environment } from "src/environments/environment";

const { ROLES } = environment;

@Injectable({
  providedIn: "root",
})
export class RolService {
  private roles: string[] = [];

  constructor(private autenticationService: ImplicitAutenticationService) {}

  async cargarRoles() {
    const rolesObtenidos: any = await this.autenticationService.getRole();
    this.roles = ROLES.filter((rol) => rolesObtenidos.includes(rol));
  }

  getRoles(): string[] {
    return this.roles;
  }

  // Permiso para creación y edición
  permisoCreacion(roles: string[]): boolean {
    return roles.some((rol) => this.roles.includes(rol));
  }

  // Permiso para mostrar columna de acciones en un módulo en especifico
  mostrarAcciones(accionesModulo: any) {
    return this.roles.some((rol) => accionesModulo[rol]);
  }
}
