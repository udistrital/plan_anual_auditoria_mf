import { Component, OnInit, ViewChild, ChangeDetectorRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Formulario } from "src/app/shared/data/models/formulario.model";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { FormularioDinamicoComponent } from "src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";
import { formularioPAA } from "./registrar-plan.utilidades";
import { Auditoria } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria";

@Component({
  selector: "app-registrar-plan",
  templateUrl: "./registrar-plan.component.html",
  styleUrl: "./registrar-plan.component.css",
})
export class RegistrarPlanComponent implements OnInit {
  @ViewChild(FormularioDinamicoComponent)
  formularioDinamico!: FormularioDinamicoComponent;

  planId: string = "";
  formulario: Formulario = formularioPAA;
  datosCargados = false;
  estadoIdActual: number | null = null;
  modoEditar: boolean = true;
  breadcrumb: string = "";
  labelAccion: string = "";
  auditoriaItems: any;
  vigenciaNombre: string = "";

  // parametros: Record<string, any> = {};

  constructor(
    private alertaService: AlertService,
    private cdr: ChangeDetectorRef,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    private PlanAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.route.params.subscribe(async (params) => {
      this.planId = params["id"];
      this.vigenciaNombre = localStorage.getItem('vigencia') || '';
      this.inicializarFormulario();

      try {
        const planData = await this.obtenerPlanAuditoria();
        await this.obtenerEstadoActual();
        this.labelAccion = this.modoEditar ? "Editar Marco General" : "Ver Detalle";
        this.breadcrumb = `Gestión Auditoría / Programación / Plan Anual de Auditorías / <b>${this.labelAccion}</b>`;

        if (planData) {
          this.actualizarValoresFormulario(planData);
        }

        this.datosCargados = true;
        this.cdr.detectChanges();
      } catch (error) {
        console.error("Error inicializando el componente:", error);
      }
    });
  }

  inicializarFormulario(): void {
    this.formulario = JSON.parse(JSON.stringify(formularioPAA));
  }

  async obtenerPlanAuditoria(): Promise<any> {
    try {
      const response = await this.PlanAnualAuditoriaMid
        .get(`plan-auditoria/${this.planId}`)
        .toPromise();
      
      return response?.Data;
    } catch (error) {
      console.error("Error al obtener el plan de auditoría:", error);
      return null;
    }
  }

  async obtenerEstadoActual(): Promise<void> {
    try {
      const response = await this.planAnualAuditoriaService
        .get(`estado?query=plan_auditoria_id:${this.planId},actual:true`)
        .toPromise();
      const estadoActual = response?.Data?.[0];
      this.estadoIdActual = estadoActual?.estado_id || null;
      this.modoEditar,
        (this.modoEditar =
          this.estadoIdActual === environment.PLAN_ESTADO.EN_BORRADOR_ID ||
          this.estadoIdActual === environment.PLAN_ESTADO.RECHAZADO);
      this.actualizarEstadoCampos();
    } catch (error) {
      console.error("Error al obtener el estado actual:", error);
      this.modoEditar = false;
      this.actualizarEstadoCampos();
    }
  }

  actualizarEstadoCampos(): void {
    this.formulario.campos?.forEach((campo) => {
      campo.deshabilitado = !this.modoEditar;
    });
  }

  actualizarValoresFormulario(planData: any): void {
    if (!this.modoEditar) {
      this.cargarInfoModoVer(planData);
    }
    const { objetivo, alcance, criterio, recurso } = planData;

    // Verifica si los campos existen antes de asignar sus valores en el formulario
    if (objetivo || alcance || criterio || recurso) {
      this.formulario.campos?.forEach((campo) => {
        switch (campo.nombre) {
          case "objetivo":
            campo.valor = objetivo || "";
            break;
          case "alcance":
            campo.valor = alcance || "";
            break;
          case "criterio":
            campo.valor = criterio || "";
            break;
          case "recurso":
            campo.valor = recurso || "";
            break;
          default:
            break;
        }
      });
    } else {
      this.inicializarFormulario();
    }
    this.actualizarEstadoCampos();
  }

  errorRegistro() {
    this.alertaService.showErrorAlert(
      "Información no guardada por favor intente nuevamente"
    );
  }

  guardarInformacion() {
    this.alertaService
      .showConfirmAlert("¿Está seguro(a) de guardar la información?")
      .then((result) => {
        if (result.isConfirmed) {
          this.formularioDinamico.submitFormulario.subscribe(
            (formData: any) => {
              this.manejarEnvio(formData);
            }
          );
          this.enviarFormulario();
        }
      });
  }

  enviarFormulario(): void {
    if (this.formularioDinamico) {
      this.formularioDinamico.onSubmit();
    }
  }

  async manejarEnvio(formData: any): Promise<void> {
    if (formData) {
      this.planAnualAuditoriaService
        .put(`plan-auditoria/${this.planId}`, formData)
        .subscribe(
          async () => {
            const updatedData = await this.obtenerPlanAuditoria();
            if (updatedData) this.actualizarValoresFormulario(updatedData);

            this.alertaService.showSuccessAlert(
              "La información fue guardada exitosamente"
            );
          },
          (error) => {
            console.error("Error al guardar la información:", error);
            this.errorRegistro();
          }
        );
    } else {
      this.errorRegistro();
    }
  }

  cargarInfoModoVer(planData: any) {
    this.auditoriaItems = [
      {
        icon: "flag",
        title: "Objetivo",
        content: planData.objetivo,
      },
      {
        icon: "track_changes",
        title: "Alcance",
        content: planData.alcance,
      },
      {
        icon: "check_circle",
        title: "Criterios",
        content: planData.criterio,
      },
      {
        icon: "inventory",
        title: "Recursos",
        content: planData.recurso,
      },
    ];
    return;
  }

  regresarRuta() {
    this.router.navigate([`/programacion/plan-auditoria`]);
  }
}
