import { AfterViewInit, ChangeDetectorRef, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatStepper } from "@angular/material/stepper";
import { BreakpointObserver } from "@angular/cdk/layout";
import { Router, ActivatedRoute } from "@angular/router";
import { Formulario } from "src/app/shared/data/models/formulario.model";
import { formularioDependencias, formularioInformacionSeguimiento } from "./editar-informe-seguimiento.utilidades";
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormularioDinamicoComponent } from 'src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component';
import { AspectosEvaluadosSeguimientoComponent } from './aspectos-evaluados-seguimiento/aspectos-evaluados-seguimiento.component';
import { AlertService } from "src/app/shared/services/alert.service";
import { MatDialog } from "@angular/material/dialog";
import { ModalVerDocumentoComponent } from "src/app/shared/elements/components/dialogs/modal-ver-documento/modal-ver-documento.component";
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { NuxeoService } from 'src/app/core/services/nuxeo.service';
import { ReferenciaPdfService } from 'src/app/core/services/referencia-pdf.service';
import { RolService } from 'src/app/core/services/rol.service';
import { ImplicitAutenticationService } from 'src/app/core/services/implicit_autentication.service';
import { Auditoria } from 'src/app/shared/data/models/auditoria';
import { environment } from 'src/environments/environment';
import { accionesEjecucionFinal, accionesEjecucionPreliminar } from 'src/app/shared/utils/accionesPorRolYEstado';

@Component({
  selector: 'app-editar-informe-seguimiento',
  templateUrl: './editar-informe-seguimiento.component.html',
  styleUrls: ['./editar-informe-seguimiento.component.css'],
  standalone: false
})
export class EditarInformeSeguimientoComponent implements OnInit, AfterViewInit {
  @ViewChild("stepper") stepper!: MatStepper;

  @ViewChild("formularioInformacionComp")
  formularioInformacionComponent!: FormularioDinamicoComponent;

  @ViewChild(AspectosEvaluadosSeguimientoComponent)
  aspectosEvaluadosComp!: AspectosEvaluadosSeguimientoComponent;
  formularioInformacion: Formulario | undefined;

  @ViewChildren("formularioDependenciasComp")
  formularioDependenciasComponent!: QueryList<FormularioDinamicoComponent>;
  formularioDependencias: Formulario = formularioDependencias;

  formAspectosGenerales: FormGroup;
  formObservacionesConclusiones: FormGroup;

  informeId!: string;
  informeData: any = null;
  auditoria: Auditoria | null = null;
  soloLectura: boolean = false;
  esLineal = false;
  orientation: "horizontal" | "vertical" = "horizontal";
  estadoId: number = 0;

  constructor(
    private readonly alertaService: AlertService,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly dialog: MatDialog,
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly nuxeoService: NuxeoService,
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly rolService: RolService,
  ) {
    this.formAspectosGenerales = this.fb.group({
      aspecto_general: [''],
    });
    this.formObservacionesConclusiones = this.fb.group({
      observacion_conclusion: [''],
      nota: [''],
    });
  }

  ngOnInit() {
    this.soloLectura = this.route.snapshot.queryParamMap.get('soloLectura') === 'true';
    this.cargarFormularios();
    this.manejarResponsiveStepper();
    this.informeId = this.route.snapshot.paramMap.get("id")!;
    this.cargarInforme();
  }

  ngAfterViewInit(): void {
    this.aplicarModoSoloLectura();
  }

  private aplicarModoSoloLectura(): void {
    if (!this.soloLectura) return;
    this.formAspectosGenerales.disable({ emitEvent: false });
    this.formObservacionesConclusiones.disable({ emitEvent: false });
    if (this.formularioInformacionComponent?.form) {
      this.formularioInformacionComponent.form.disable({ emitEvent: false });
    }
  }

  cargarFormularios(): void {
    this.formularioInformacion = formularioInformacionSeguimiento;
    this.formularioDependencias = formularioDependencias;
  }

  manejarResponsiveStepper() {
    this.breakpointObserver
      .observe(["(max-width: 992px)"])
      .subscribe((result) => {
        this.orientation = result.matches ? "vertical" : "horizontal";
      });
  }

  regresarRuta() {
    this.router.navigate([`/ejecucion/seguimiento-informes`]);
  }

  // Carga el informe y la auditoría enriquecida (MID) para poblar todos los campos
  cargarInforme(): void {
    this.planAnualAuditoriaService.get(`informe/${this.informeId}`).subscribe({
      next: (response: any) => {
        if (response?.Data) {
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

  cargarEstadoAuditoria(): void {
    const auditoriaId = this.informeData?.auditoria_id;
    if (!auditoriaId) return;
    this.planAnualAuditoriaService.get(`auditoria-estado?query=auditoria_id:${auditoriaId},actual:true`).subscribe({
      next: (res: any) => {
        this.estadoId = res.Data?.[0]?.estado_id ?? 0;
        this.forzarSoloLecturaSegunPermisos();
        this.aplicarModoSoloLectura();
      },
      error: () => { }
    });
  }

  private forzarSoloLecturaSegunPermisos(): void {
    const roles = this.rolService.getRoles();
    const puedeEditar = roles.some((rol) => {
      const acciones =  accionesEjecucionFinal[rol]?.[this.estadoId] ?? []
      return acciones.includes('Editar Informe');
    });

    if (!puedeEditar) {
      this.soloLectura = true;
    }
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

  // Pobla los formularios con los datos del informe cargado
  poblarFormularios(): void {
    if (!this.informeData) return;

    // Poblar formulario de aspectos generales (paso 2)
    this.formAspectosGenerales.patchValue({
      aspecto_general: this.informeData.aspecto_general,
    });

    // Poblar formulario de observaciones y conclusiones (último paso)
    this.formObservacionesConclusiones.patchValue({
      observacion_conclusion: this.informeData.observacion_conclusion,
      nota: this.informeData.nota,
    });
  }

  // Pobla el formulario de información con datos del informe y de la auditoría enriquecida
  poblarFormularioInformacion(auditoria?: Auditoria): void {
    if (!this.formularioInformacionComponent) return;
    this.auditoria = auditoria ?? null;
    this.changeDetector.detectChanges();

    const valoresIniciales: any = {
      no_auditoria: auditoria?.consecutivo_no_auditoria,
      macroproceso: auditoria?.macroproceso_nombre,
      proceso: auditoria?.proceso_nombre,
      objetivo_auditoria: auditoria?.objetivo,
      alcance_auditoria: auditoria?.alcance,
      criterios: auditoria?.criterio,
    };

    if (this.informeData?.fecha_emision) {
      valoresIniciales.fecha_emision_informe = new Date(this.informeData.fecha_emision);
    }
    if (this.informeData?.muestra) {
      valoresIniciales.muestra = this.informeData.muestra;
    }

    this.formularioInformacionComponent.form.patchValue(valoresIniciales);

    this.formularioDependenciasComponent.forEach((comp, i) => {
      const dep = this.auditoria?.datos_dependencias[i];
      const correo = this.auditoria?.correo_complementario?.find((c: any) => c.dependencia_id === dep?.dependencia_id)?.correo ?? '';
      comp.form.patchValue({
        dependencia_id: dep?.dependencia_id,
        jefe_nombre: dep?.jefe_nombre,
        jefe_correo: dep?.jefe_correo,
        asistente_nombre: dep?.asistente_nombre,
        asistente_correo: dep?.asistente_correo,
        correo_dependencia: dep?.correo_dependencia,
        correo_complementario: correo,
      });
    });

    this.aplicarModoSoloLectura();
  }

  enviarFormInformacion() {
    this.formularioInformacionComponent.onSubmit();
  }

  preguntarGuardadoInformacion(dataForm: any) {
    if (!dataForm) {
      return this.alertaService.showAlert("Formulario incompleto", "Debe llenar todos los campos obligatorios");
    }
    this.confirmarGuardado(() => this.guardarInformacion(dataForm));
  }

  guardarInformacion(informacion: any) {
    const campos = {
      fecha_emision: informacion.fecha_emision_informe,
      muestra: informacion.muestra ?? null,
    };
    this.guardarPaso(campos, "La información se ha guardado correctamente", "No se pudo guardar la información");
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

  private async confirmarGuardado(accion: () => any): Promise<void> {
    const confirmado = await this.alertaService.showConfirmAlert("¿Está seguro(a) de guardar la información?");
    if (!confirmado.value) return;
    await accion();
  }

  guardarAspectosGenerales() {
    this.confirmarGuardado(() =>
      this.guardarPaso(this.formAspectosGenerales.value, "Los aspectos generales se han guardado correctamente", "No se pudieron guardar los aspectos generales")
    );
  }

  async guardarAspectosEvaluados(): Promise<void> {
    this.confirmarGuardado(async () => {
      const ok = await this.aspectosEvaluadosComp.guardarAspectos();
      if (ok) this.stepper.next();
    });
  }

  guardarObservacionesConclusiones() {
    this.confirmarGuardado(() =>
      this.guardarPaso(this.formObservacionesConclusiones.value, "Las observaciones se han guardado correctamente", "No se pudieron guardar las observaciones")
    );
  }

  verInforme(): void {
    const auditoriaId = this.informeData?.auditoria_id;
    if (!auditoriaId) {
      this.alertaService.showErrorAlert("No fue posible identificar la auditoría asociada.");
      return;
    }

    this.planAuditoriaMid.get(`plantilla/informe-seguimiento/${auditoriaId}`).subscribe({
      next: (res: any) => {
        const documentoBase64 = res?.Data;
        if (!documentoBase64) {
          this.alertaService.showErrorAlert("No fue posible generar el informe.");
          return;
        }
        this.abrirModalVerInforme(documentoBase64);
      },
      error: () => {
        this.alertaService.showErrorAlert("No fue posible generar el informe.");
      },
    });
  }

  private abrirModalVerInforme(documentoBase64: any): void {
    const dialogRef = this.dialog.open(ModalVerDocumentoComponent, {
      width: "1000px",
      data: documentoBase64,
      autoFocus: false,
    });

    if (!this.soloLectura) {
      dialogRef.componentInstance.botonGuardar = { icono: "save", texto: "Guardar documento" };
    }

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.accion === "guardarDocumento") {
        this.guardarDocumento(documentoBase64);
      }
    });
  }

  private guardarDocumento(documentoBase64: any): void {
    const payload = {
      IdTipoDocumento: environment.TIPO_DOCUMENTO.PROGRAMA_TRABAJO_AUDITORIA,
      nombre: "Informe Final",
      descripcion: "Documento pdf (informe-seguimiento) de seguimiento de plan de auditoría",
      metadatos: {},
      file: documentoBase64,
    };

    this.nuxeoService.guardarArchivos([payload]).subscribe({
      next: (response: any) => {
        this.guardarReferencia(response[0]);
      },
      error: () => {
        this.alertaService.showErrorAlert("Error al subir el documento.");
      },
    });
  }

  private guardarReferencia(nuxeoResponse: any): void {
    if (!nuxeoResponse?.res?.Enlace) return;
    this.referenciaPdfService
      .guardarReferencia(
        nuxeoResponse.res,
        "Auditoria",
        this.informeData?.auditoria_id,
        environment.TIPO_DOCUMENTO_PARAMETROS.INFORME_FINAL
      )
      .subscribe({
        next: () => this.alertaService.showSuccessAlert("Informe guardado exitosamente."),
        error: () => this.alertaService.showErrorAlert("Error al guardar la referencia del documento."),
      });
  }
}
