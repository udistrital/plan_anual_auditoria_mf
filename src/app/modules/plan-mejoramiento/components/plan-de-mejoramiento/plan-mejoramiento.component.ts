import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { TablaPlanMejoramientoComponent } from "./ tabla-plan-mejoramiento/tabla-plan-mejoramiento.component";
import { ImplicitAutenticationService } from "src/app/core/services/implicit_autentication.service";

@Component({
  selector: "app-plan-de-mejoramiento",
  templateUrl: "./plan-mejoramiento.component.html",
  styleUrls: ["./plan-mejoramiento.component.css"]
})
export class PlanDeMejoramientoComponent implements OnInit {
  @ViewChild(TablaPlanMejoramientoComponent)
  tablaPlanMejoramiento!: TablaPlanMejoramientoComponent;

  vigencias: any[] = [];
  tiposEvaluacion: any[] = [];
  planMejoramientoForm!: FormGroup;
  vigenciaSeleccionada!: number;
  tipoEvaluacionSeleccionado!: number;
  role: string | null = null;

  constructor(
    private fb: FormBuilder,
    private parametrosUtilsService: ParametrosUtilsService,
    private autenticacionService: ImplicitAutenticationService,
  ) {}

  ngOnInit() {
    this.buscarRol();
    this.iniciarForm();
    this.cargarVigencias();
    this.cargarTiposEvaluacion();
  }

  buscarRol() {
    this.autenticacionService.getRole().then((roles: any) => {
      if (!roles || roles.length === 0) {
        console.error("No se encontraron roles para este usuario");
        return;
      }
      const IsSecretario = roles.includes("SECRETARIO_AUDITOR");
      const IsAuditor = roles.some((role: string) => role === "AUDITOR_EXPERTO" || role === "AUDITOR");
      const IsJefe = roles.includes("JEFE_CONTROL_INTERNO");

      this.role = IsSecretario ? "secretario" : IsAuditor ? "auditor" : IsJefe ? "jefe" : null;
      console.log("Rol actual:", this.role);
    });
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

  cargarTiposEvaluacion() {
    this.tiposEvaluacion = [
      { Id: 1, Nombre: "Interna" },
      { Id: 2, Nombre: "Externa" }
    ];
  }

  onVigenciaChange(vigencia: Vigencia) {
    this.vigenciaSeleccionada = vigencia.Id;
    this.buscarPlanes();
  }

  onTipoEvaluacionChange(tipoEvaluacion: any) {
    this.tipoEvaluacionSeleccionado = tipoEvaluacion.Id;
    this.buscarPlanes();
  }

  buscarPlanes() {
    if (this.vigenciaSeleccionada && this.tipoEvaluacionSeleccionado) {
      this.tablaPlanMejoramiento.listarPlanesPorFiltros(
        this.vigenciaSeleccionada,
        this.tipoEvaluacionSeleccionado
      );
    }
  }

  iniciarForm() {
    this.planMejoramientoForm = this.fb.group({
      vigencia: ["", Validators.required],
      tipoEvaluacion: ["", Validators.required],
    });
  }
}