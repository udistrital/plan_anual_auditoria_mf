import { Injectable } from "@angular/core";
import { ImplicitAutenticationService } from "./implicit_autentication.service";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class RolService {
  private roles: string[] = [];

  constructor(private autenticationService: ImplicitAutenticationService) {}

  async cargarRoles() {
    const rolesValidos = environment.ROLES;
    const rolesObtenidos: any = await this.autenticationService.getRole();
    this.roles = rolesValidos.filter((rol) => rolesObtenidos.includes(rol));
  }

  getRoles(): string[] {
    return this.roles;
  }
}
