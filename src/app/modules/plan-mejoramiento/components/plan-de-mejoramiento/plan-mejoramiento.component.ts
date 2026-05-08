import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { TablaPlanMejoramientoComponent } from "./ tabla-plan-mejoramiento/tabla-plan-mejoramiento.component";
import { RolService } from "src/app/core/services/rol.service";
import { UserService } from "src/app/core/services/user.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-plan-de-mejoramiento",
  templateUrl: "./plan-mejoramiento.component.html",
  styleUrls: ["./plan-mejoramiento.component.css"],
})
export class PlanDeMejoramientoComponent implements OnInit {
  @ViewChild(TablaPlanMejoramientoComponent)
  tablaPlanMejoramiento!: TablaPlanMejoramientoComponent;

  vigencias: any[] = [];
  tiposEvaluacion: any[] = [];
  planMejoramientoForm!: FormGroup;
  vigenciaSeleccionada!: number;
  tipoEvaluacionSeleccionado!: number;

  /** Rol prioritario del usuario actual */
  role: string | null = null;
  /** ID de persona del usuario actual */
  personaId: number | null = null;
  accionesPermitidas: string[] | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly parametrosUtilsService: ParametrosUtilsService,
    private readonly rolService: RolService,
    private readonly userService: UserService,
    private readonly route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.accionesPermitidas = this.route.snapshot.data['accionesPermitidas'] ?? null;
    this.iniciarForm();
    this.cargarVigencias();
    this.cargarTiposEvaluacion();
    this.obtenerRolPrioritario();
    this.personaId = await this.userService.getPersonaId();
  }

  obtenerRolPrioritario(): void {
    this.role = this.rolService.getRolPrioritario([
      environment.ROL.JEFE,
      environment.ROL.AUDITOR_EXPERTO,
      environment.ROL.AUDITOR,
      environment.ROL.AUDITOR_ASISTENTE,
      environment.ROL.JEFE_DEPENDENCIA,
      environment.ROL.ASISTENTE_DEPENDENCIA,
    ]);
  }

  cargarVigencias(): void {
    this.parametrosUtilsService.getVigencias().subscribe({
      next: (data) => {
        this.vigencias = data;
      },
      error: (err) => {
        console.error("Error cargando vigencias:", err);
      },
    });
  }

  cargarTiposEvaluacion(): void {
    // Tipos de evaluación relevantes para plan de mejoramiento
    this.tiposEvaluacion = [
      { Id: environment.TIPO_EVALUACION.AUDITORIA_INTERNA_ID, Nombre: "Auditoría Interna" },
    ];
  }

  onVigenciaChange(vigencia: Vigencia): void {
    this.vigenciaSeleccionada = vigencia.Id;
    this.buscarPlanes();
  }

  onTipoEvaluacionChange(tipoEvaluacion: any): void {
    this.tipoEvaluacionSeleccionado = tipoEvaluacion.Id;
    this.buscarPlanes();
  }

  buscarPlanes(): void {
    if (this.vigenciaSeleccionada && this.tipoEvaluacionSeleccionado) {
      this.tablaPlanMejoramiento.listarPlanesPorFiltros(
        this.vigenciaSeleccionada,
        this.tipoEvaluacionSeleccionado
      );
    }
  }

  iniciarForm(): void {
    this.planMejoramientoForm = this.fb.group({
      vigencia: ["", Validators.required],
      tipoEvaluacion: ["", Validators.required],
    });
  }
}