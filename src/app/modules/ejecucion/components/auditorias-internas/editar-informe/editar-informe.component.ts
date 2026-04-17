import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatStepper } from "@angular/material/stepper";
import { BreakpointObserver } from "@angular/cdk/layout";
import { Router, ActivatedRoute } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { Formulario } from "src/app/shared/data/models/formulario.model";
import { formularioInformacionAuditoria } from "./editar-informe.utilidades";
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormularioDinamicoComponent } from 'src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component';
import { AlertService } from "src/app/shared/services/alert.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { ReferenciaPdfService } from 'src/app/core/services/referencia-pdf.service';
import { environment } from 'src/environments/environment';
import { AspectosEvaluadosComponent } from './aspectos-evaluados/aspectos-evaluados.component';
import { ResumenHallazgosComponent } from './resumen-hallazgos/resumen-hallazgos.component';
import { ModalVerDocumentoComponent } from 'src/app/shared/elements/components/dialogs/modal-ver-documento/modal-ver-documento.component';
import { join } from 'node:path';

@Component({
  selector: 'app-editar-informe',
  templateUrl: './editar-informe.component.html',
  styleUrls: ['./editar-informe.component.css']
})

export class EditarInformeComponent implements OnInit, AfterViewInit {
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

  // Cuando el informe ya fue aprobado por el auditado -> Pasa a informe final
  get pasosInicialesSoloLectura(): boolean {
    return this.estadoId >= environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL;
  }

  constructor(
    private alertaService: AlertService,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private nuxeoService: NuxeoService,
    private referenciaPdfService: ReferenciaPdfService,
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

  ngAfterViewInit(): void {
    this.aplicarModoSoloLecturaPasosIniciales();
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
        this.aplicarModoSoloLecturaPasosIniciales();
      },
      error: () => { }
    });
  }

  private aplicarModoSoloLecturaPasosIniciales(): void {
    if (!this.pasosInicialesSoloLectura) return;

    this.formAspectosGenerales.disable({ emitEvent: false });

    if (this.formularioInformacionComponent?.form) {
      this.formularioInformacionComponent.form.disable({ emitEvent: false });
    }
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
      consecutivo_no_auditoria: auditoria?.consecutivo_no_auditoria,
      macroproceso: auditoria?.macroproceso_nombre,
      proceso: auditoria?.proceso_nombre,
      dependencia: auditoria?.dependencia_nombre,
      jefe_nombre: auditoria?.jefe_nombre,
      asistente_nombre: auditoria?.asistente_nombre,
      correo_dependencia: auditoria?.correo_dependencia,
      jefe_correo: auditoria?.jefe_correo,
      asistente_correo: auditoria?.asistente_correo,
      correo_complementario: auditoria.correo_complementario.map((c: any) => c.correo).join(", "),
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

  verPreinforme(): void {
    const auditoriaId = this.informeData?.auditoria_id;

    if (!auditoriaId) {
      this.alertaService.showErrorAlert("No fue posible identificar la auditoría asociada.");
      return;
    }

    this.planAuditoriaMid.get(`plantilla/informe-auditoria/${auditoriaId}`).subscribe({
      next: (res: any) => {
        const documentoBase64 = res?.Data;

        if (!documentoBase64) {
          this.alertaService.showErrorAlert("No fue posible generar el preinforme.");
          return;
        }

        this.verDocumento(documentoBase64, {
          nombre: "Informe Preliminar",
          plantilla: "informe-auditoria",
          parametro: environment.TIPO_DOCUMENTO_PARAMETROS.INFORME_PRELIMINAR,
        });
      },
      error: (error: any) => {
        console.error("Error al generar el preinforme:", error);
        this.alertaService.showErrorAlert("No fue posible generar el preinforme.");
      },
    });
  }

  verInforme(): void {
    const auditoriaId = this.informeData?.auditoria_id;

    if (!auditoriaId) {
      this.alertaService.showErrorAlert("No fue posible identificar la auditoría asociada.");
      return;
    }

    this.planAuditoriaMid.get(`plantilla/informe-auditoria/${auditoriaId}`).subscribe({
      next: (res: any) => {
        const documentoBase64 = res?.Data;

        if (!documentoBase64) {
          this.alertaService.showErrorAlert("No fue posible generar el informe.");
          return;
        }

        this.verDocumento(documentoBase64, {
          nombre: "Informe Final",
          plantilla: "informe-auditoria",
          parametro: environment.TIPO_DOCUMENTO_PARAMETROS.INFORME_FINAL,
        });
      },
      error: (error: any) => {
        console.error("Error al generar el informe:", error);
        this.alertaService.showErrorAlert("No fue posible generar el informe.");
      },
    });
  }

  verDocumento(documentoBase64: any, infoDocumento: any): void {
    const dialogRef = this.dialog.open(ModalVerDocumentoComponent, {
      width: "1000px",
      data: documentoBase64,
      autoFocus: false,
    });

    const modalInstance = dialogRef.componentInstance;
    modalInstance.botonGuardar = { icono: "save", texto: "Guardar documento" };

    dialogRef.afterClosed().subscribe((res) => {
      if (!res) return;

      if (res.accion === "guardarDocumento") {
        this.guardarDocumento(documentoBase64, infoDocumento);
      }
    });
  }

  guardarDocumento(documentoBase64: any, infoDocumento: any) {
    if (documentoBase64 !== "") {
      const payload = {
        IdTipoDocumento: environment.TIPO_DOCUMENTO.PROGRAMA_TRABAJO_AUDITORIA,
        nombre: infoDocumento.nombre,
        descripcion:
          "Documento pdf (" +
          infoDocumento.plantilla +
          ") de auditoría de plan de auditoría",
        metadatos: {},
        file: documentoBase64,
      };

      this.nuxeoService.guardarArchivos([payload]).subscribe({
        next: (response: any) => {
          const documentoRefNuxeo = response[0];

          this.guardarReferencia(
            documentoRefNuxeo,
            "Auditoria",
            this.informeData?.auditoria_id,
            infoDocumento.parametro
          );
        },
        error: (error: any) => {
          console.error("Error al subir el documento", error);
        },
      });
    }
  }

  guardarReferencia(
    nuxeoResponse: any,
    referencia_tipo: string,
    referencia_id: string,
    tipo_id: number,
    metadatos?: Record<string, any>,
    onSuccess?: () => void
  ): void {
    if (nuxeoResponse.res.Enlace) {
      this.referenciaPdfService
        .guardarReferencia(
          nuxeoResponse.res,
          referencia_tipo,
          referencia_id,
          tipo_id,
          metadatos
        )
        .subscribe({
          next: () => {
            this.alertaService.showSuccessAlert("Archivo subido exitosamente.");
            onSuccess?.();
          },
          error: (error: any) => {
            console.error("Error al guardar la referencia", error);
          },
        });
    }
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
