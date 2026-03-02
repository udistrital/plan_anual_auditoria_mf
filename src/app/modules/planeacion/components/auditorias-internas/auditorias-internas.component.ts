import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { TablaAuditoriasInternasComponent } from "./tabla-auditorias-internas/tabla-auditorias-internas.component";
import { RolService } from "src/app/core/services/rol.service";
import { UserService } from "src/app/core/services/user.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-auditorias-internas",
  templateUrl: "./auditorias-internas.component.html",
  styleUrl: "./auditorias-internas.component.css",
})
export class AuditoriasInternasComponent implements OnInit {
  @ViewChild(TablaAuditoriasInternasComponent)
  tablaAuditorias!: TablaAuditoriasInternasComponent;

  vigencias: any[] = [];
  vigenciaForm!: FormGroup;
  vigenciaSeleccionada!: number;
  role: string | null = null;
  personaId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private parametrosUtilsService: ParametrosUtilsService,
    private rolService: RolService,
    private userService: UserService,
  ) { }

  async ngOnInit() {
    this.personaId = await this.userService.getPersonaId();
    this.obtenerRolPrioritario();
    this.iniciarvigenciaForm();
    this.cargarVigencias();
  }

  obtenerRolPrioritario() {
    this.role = this.rolService.getRolPrioritario([
      environment.ROL.SECRETARIO,
      environment.ROL.AUDITOR_EXPERTO,
      environment.ROL.AUDITOR,
      environment.ROL.AUDITOR_ASISTENTE,
      environment.ROL.JEFE,
    ]);
  }

  cargarVigencias() {
    this.parametrosUtilsService.getVigencias().subscribe({
      next: (data) => {
        this.vigencias = data;
      },
      error: (err) => {
        console.error("Error load vigencias", err);
      }
    });
  }

  mostrarAuditoriasPorVigencia(vigencia: Vigencia) {
    this.vigenciaSeleccionada = vigencia.Id;
    this.tablaAuditorias.listarAuditoriasPorVigencia(this.vigenciaSeleccionada);
  }

  iniciarvigenciaForm() {
    this.vigenciaForm = this.fb.group({
      vigencia: ["", Validators.required],
    });
  }
}