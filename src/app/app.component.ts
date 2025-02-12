import { Component } from "@angular/core";
import { RolService } from "./core/services/rol.service";

@Component({
  selector: 'plan-anual-auditoria-mf',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = "plan_anual_auditoria_mf";
  
  constructor(private rolService: RolService) {}

  ngOnInit(): void {
    this.rolService.cargarRoles();
  }
}
