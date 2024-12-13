import {
  Component,
  OnInit,
  OnChanges,
  ViewChild,
  ChangeDetectorRef,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Formulario } from "src/app/shared/data/models/formulario.model";
import { formularioPAA } from "src/app/shared/data/forms/formulario-PAA-valores";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { FormularioDinamicoComponent } from "src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";

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
  mostrarBotones: boolean = true;
  // parametros: Record<string, any> = {};

  constructor(
    private alertaService: AlertService,
    private route: ActivatedRoute,
    private parametrosService: ParametrosService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.route.params.subscribe(async (params) => {
      this.planId = params["id"];
      this.inicializarFormulario();

      try {
        const planData = await this.obtenerPlanAuditoria();
        await this.obtenerEstadoActual();

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
      const response = await this.planAnualAuditoriaService
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
      this.mostrarBotones =
        this.estadoIdActual === environment.PLAN_ESTADO.EN_BORRADOR_ID ||
        this.estadoIdActual === environment.PLAN_ESTADO.EN_RECHAZO_ID;
      this.actualizarEstadoCampos();
    } catch (error) {
      console.error("Error al obtener el estado actual:", error);
      this.mostrarBotones = false;
      this.actualizarEstadoCampos(); 
    }
  }

  

  actualizarEstadoCampos(): void {
    this.formulario.campos?.forEach((campo) => {
      campo.deshabilitado = !this.mostrarBotones;
    });
  }

  actualizarValoresFormulario(planData: any): void {
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

  regresarRuta() {
    this.router.navigate([`/programacion/plan-auditoria`]);
  }
}

// Función asíncrona para obtener valores de parámetros
// async obtenerParametros(): Promise<void> {
//   const camposIds = Object.values     (environment.idsCamposFormulario);

//   const requests = camposIds.map(async (campoId) => {
//     try {
//       const res = await this.parametrosService.get(`parametro/${campoId}`).toPromise();
//       if (res && res.Data) {
//         this.parametros[campoId] = res.Data.Descripcion;
//       }
//     } catch (error) {
//       console.error(`Error cargando valor para el campo con id ${campoId}`, error);
//     }
//   });

//   await Promise.all(requests);
// }

// Selecciona y modifica el formulario según los parámetros obtenidos
// loadFormulario(): void {
//   if (this.planId === '1') {
//     this.formulario = formularioPAA1;
//   } else if (this.planId === '2') {
//     this.formulario = formularioPAA2;
//   } else {
//     console.error('No se encontró un formulario para el planId:', this.planId);
//     return;
//   }

//   // this.cargarValoresFormulario();
// }

// Asigna valores a cada campo del formulario usando los parámetros obtenidos
// cargarValoresFormulario(): void {
//   if (this.formulario && this.formulario.campos) {
//     this.formulario.campos.forEach((campo) => {
//       const campoId = environment.idsCamposFormulario[campo.nombre as keyof typeof environment.idsCamposFormulario];
//       if (campoId && this.parametros[campoId]) {
//         campo.valor = this.parametros[campoId];
//       } else {
//         console.warn(`No se encontró un id o valor para el campo ${campo.nombre}`);
//       }
//     });
//     this.cdr.detectChanges();
//   } else {
//     console.error("El formulario o sus campos no están definidos");
//   }
// }
