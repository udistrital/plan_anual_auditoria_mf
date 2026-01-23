import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { AlertService } from "src/app/shared/services/alert.service";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { TablaAuditoriasInternasComponent } from "./tabla-auditorias-internas/tabla-auditorias-internas.component";
import { ImplicitAutenticationService } from "src/app/core/services/implicit_autentication.service";

@Component({
  selector: "app-auditorias-internas",
  templateUrl: "./auditorias-internas.component.html",
  styleUrls: ["./auditorias-internas.component.css"]
})
export class AuditoriasInternasComponent implements OnInit {
  @ViewChild(TablaAuditoriasInternasComponent)
  tablaAuditorias!: TablaAuditoriasInternasComponent;

  vigencias: any[] = [];
  vigenciaForm!: FormGroup;
  vigenciaSeleccionada!: number;
  role: string | null = null;
  IsSecretario = false;
  IsAuditor = false;
  IsJefe = false;

  constructor(
    private fb: FormBuilder,
    private parametrosService: ParametrosService,
    private autenticacionService: ImplicitAutenticationService,
  ) { }

  ngOnInit() {
    this.buscarRol();
    this.iniciarvigenciaForm();
    this.cargarVigencias();
  }

  buscarRol() {
    this.autenticacionService.getRole().then((roles: any) => {
      if (!roles || roles.length === 0) {
        console.error("No se encontraron roles para este usuario");
        return;
      }

      this.IsSecretario = roles.includes("SECRETARIO_AUDITOR");
      this.IsAuditor = roles.some((role: string) => role === "AUDITOR_EXPERTO" || role === "AUDITOR");
      this.IsJefe = roles.includes("JEFE_CONTROL_INTERNO");

      this.role = this.IsSecretario
        ? "secretario"
        : this.IsAuditor
          ? "auditor"
          : this.IsJefe
            ? "jefe"
            : null;

      if (this.IsAuditor) {
        this.cargarVigencias();
      }
      console.log(this.role);
    });
  }

  cargarVigencias() {
    this.parametrosService
      .get(
        "parametro?query=TipoParametroId:121&fields=Id,Nombre&limit=0&sortby=nombre&order=desc"
      )
      .subscribe((res) => {
        this.vigencias = res.Data;
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
