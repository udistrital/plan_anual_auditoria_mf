import { Component, OnInit, ViewChild } from '@angular/core';
import { MatStepper } from "@angular/material/stepper";
import { BreakpointObserver } from "@angular/cdk/layout";
import { Router, ActivatedRoute } from "@angular/router";
import { Formulario } from "src/app/shared/data/models/formulario.model";
import { formularioInformacionAuditoria } from "./editar-informe.utilidades";
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormularioDinamicoComponent } from 'src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component';
import { AlertService } from "src/app/shared/services/alert.service";
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { environment } from 'src/environments/environment';
import { AspectosEvaluadosComponent } from './aspectos-evaluados/aspectos-evaluados.component';
import { ResumenHallazgosComponent } from './resumen-hallazgos/resumen-hallazgos.component';

@Component({
  selector: 'app-editar-informe',
  templateUrl: './editar-informe.component.html',
  styleUrls: ['./editar-informe.component.css']
})

export class EditarInformeComponent implements OnInit {
  @ViewChild("stepper") stepper!: MatStepper;

  @ViewChild("formularioInformacionComp")
  formularioInformacionComponent!: FormularioDinamicoComponent;

  @ViewChild("aspectosEvaluadosComp")
  aspectosEvaluadosComponent!: AspectosEvaluadosComponent;

  @ViewChild("resumenHallazgosComp")
  resumenHallazgosComponent!: ResumenHallazgosComponent;

  formInformacion: Formulario | undefined;
  formAspectosGenerales: FormGroup;
  formInformeFinal: FormGroup;
  formRespuestaPreliminar: FormGroup;

  informeId!: string;
  informeData: any = null;
  estadoId: number = 0;
  esLineal = false;
  orientation: "horizontal" | "vertical" = "horizontal";

  get preinformeAprobado(): boolean {
    return this.estadoId >= environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO;
  }

  constructor(
    private alertaService: AlertService,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    private planAuditoriaMid: PlanAnualAuditoriaMid
  ) {
    this.formAspectosGenerales = this.fb.group({
      aspecto_general: [''],
    });
    this.formRespuestaPreliminar = this.fb.group({
      respuesta_preliminar: [''],
    });
    this.formInformeFinal = this.fb.group({
      informe_final: [''],
      observacion_conclusion: [''],
      nota: [''],
    });
  }

  ngOnInit() {
    this.cargarFormularios();
    this.manejarResponsiveStepper();
    this.informeId = this.route.snapshot.paramMap.get("id")!;
    this.cargarInforme();
  }

  cargarFormularios(): void {
    this.formInformacion = formularioInformacionAuditoria;
  }

  manejarResponsiveStepper() {
    this.breakpointObserver
      .observe(["(max-width: 992px)"])
      .subscribe((result) => {
        this.orientation = result.matches ? "vertical" : "horizontal";
      });
  }

  regresarRuta() {
    this.router.navigate([`/ejecucion/auditorias-internas`]);
  }

  // Carga el informe y la auditoría enriquecida (MID) para poblar todos los campos
  cargarInforme(): void {
    this.planAnualAuditoriaService.get(`informe/${this.informeId}`).subscribe({
      next: (response: any) => {
        if (response && response.Data) {
          this.informeData = response.Data;
          this.poblarFormularios();
          this.cargarEstadoAuditoria();
          this.cargarAuditoriaParaFormulario();
        }
      },
      error: (error) => {
        console.error('Error al cargar el informe:', error);
      }
    });
  }

  // Carga la auditoría desde el MID para obtener campos enriquecidos (macroproceso, dependencia, correos, etc.)
  cargarAuditoriaParaFormulario(): void {
    const auditoriaId = this.informeData?.auditoria_id;
    if (!auditoriaId) return;
    this.planAuditoriaMid.get(`auditoria/${auditoriaId}`).subscribe({
      next: (res: any) => {
        this.poblarFormularioInformacion(res.Data);
      },
      error: (error) => {
        console.error('Error al cargar la auditoría:', error);
        this.poblarFormularioInformacion();
      }
    });
  }

  cargarEstadoAuditoria(): void {
    const auditoriaId = this.informeData?.auditoria_id;
    if (!auditoriaId) return;
    this.planAnualAuditoriaService.get(`auditoria-estado?query=auditoria_id:${auditoriaId},actual:true`).subscribe({
      next: (res: any) => {
        this.estadoId = res.Data?.[0]?.estado_id ?? 0;
      },
      error: () => { }
    });
  }

  // Pobla los formularios con los datos del informe cargado
  poblarFormularios(): void {
    if (!this.informeData) return;

    // Poblar formulario de aspectos generales (paso 2)
    this.formAspectosGenerales.patchValue({
      aspecto_general: this.informeData.aspecto_general
    });

    // Poblar formulario de respuesta preliminar (paso 5)
    this.formRespuestaPreliminar.patchValue({
      respuesta_preliminar: this.informeData.respuesta_preliminar
    });

    // Poblar formulario de informe final (paso 6)
    this.formInformeFinal.patchValue({
      informe_final: this.informeData.informe_final,
      observacion_conclusion: this.informeData.observacion_conclusion,
      nota: this.informeData.nota,
    });
  }

  // Pobla el formulario de información con datos del informe y de la auditoría enriquecida
  poblarFormularioInformacion(auditoria?: any): void {
    if (!this.formularioInformacionComponent) return;

    const valoresIniciales: any = {
      no_auditoria: auditoria?.no_auditoria,
      macroproceso: auditoria?.macroproceso_nombre,
      proceso: auditoria?.proceso_nombre,
      dependencia: auditoria?.dependencia_nombre,
      jefe_nombre: auditoria?.jefe_nombre,
      asistente_nombre: auditoria?.asistente_nombre,
      correo_dependencia: auditoria?.correo_dependencia,
      jefe_correo: auditoria?.jefe_correo,
      asistente_correo: auditoria?.asistente_correo,
      correo_complementario: this.informeData?.correo_complementario ?? auditoria?.correo_complementario,
      objetivo_auditoria: auditoria?.objetivo,
      alcance_auditoria: auditoria?.alcance,
      criterios: auditoria?.criterio,
    };

    if (this.informeData?.fecha_emision) {
      valoresIniciales.fecha_emision = new Date(this.informeData.fecha_emision);
    }
    if (this.informeData?.muestra) {
      valoresIniciales.muestra = this.informeData.muestra;
    }

    this.formularioInformacionComponent.form.patchValue(valoresIniciales);
  }

  enviarFormInformacion() {
    this.formularioInformacionComponent.onSubmit();
  }

  preguntarGuardadoInformacion(dataForm: any) {
    if (!dataForm) {
      return this.alertaService.showAlert("Formulario incompleto", "Debe llenar todos los campos obligatorios");
    }

    this.alertaService
      .showConfirmAlert("¿Está seguro(a) de guardar la información?")
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }
        this.guardarInformacion(dataForm);
      });
  }

  guardarInformacion(informacion: any) {
    const campos = {
      fecha_emision: informacion.fecha_emision,
      muestra: informacion.muestra || null,
    };
    this.guardarPaso(campos, "La informacion se ha guardado correctamente", "No se pudo guardar la informacion");
  }

  private guardarPaso(camposActualizados: any, mensajeExito: string, mensajeError: string): void {
    const payload = { ...this.informeData, ...camposActualizados };

    this.planAnualAuditoriaService.put(`informe/${this.informeId}`, payload).subscribe({
      next: () => {
        this.alertaService.showAlert("Guardado exitoso", mensajeExito);
        this.informeData = { ...this.informeData, ...camposActualizados };
        this.stepper.next();
      },
      error: (error) => {
        console.error('Error al guardar:', error);
        this.alertaService.showAlert("Error", mensajeError);
      }
    });
  }

  guardarAspectosGenerales() {
    this.guardarPaso(this.formAspectosGenerales.value, "Los aspectos generales se han guardado correctamente", "No se pudieron guardar los aspectos generales");
  }

  // Guarda los aspectos evaluados (temas, subtemas, hallazgos) y avanza al siguiente paso
  async guardarAspectosEvaluados(): Promise<void> {
    if (this.aspectosEvaluadosComponent) {
      const ok = await this.aspectosEvaluadosComponent.guardarAspectos();
      if (ok) this.stepper.next();

      // Recargar resumen de hallazgos después de guardar
      if (this.resumenHallazgosComponent) {
        this.resumenHallazgosComponent.cargarHallazgos();
      }
    }
  }

  guardarRespuestaPreliminar() {
    this.guardarPaso(this.formRespuestaPreliminar.value, "La respuesta preliminar se ha guardado correctamente", "No se pudo guardar la respuesta preliminar");
  }

  guardarInformeFinal() {
    this.guardarPaso(this.formInformeFinal.value, "El infrorme final se ha guardado correctamente", "No se pudo guardar el informe final");
  }

  // Se ejecuta cuando se eliminan temas, subtemas o hallazgos
  onDatosActualizados(): void {
    if (this.resumenHallazgosComponent) {
      this.resumenHallazgosComponent.cargarHallazgos();
    }
  }
}
