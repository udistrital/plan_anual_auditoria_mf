import { AfterViewInit, ChangeDetectorRef, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatStepper } from "@angular/material/stepper";
import { BreakpointObserver } from "@angular/cdk/layout";
import { Router, ActivatedRoute } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { Formulario } from "src/app/shared/data/models/formulario.model";
import { formularioDependencias, formularioInformacionAuditoria } from "./editar-informe.utilidades";
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormularioDinamicoComponent } from 'src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component';
import { AlertService } from "src/app/shared/services/alert.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { ReferenciaPdfService } from 'src/app/core/services/referencia-pdf.service';
import { RolService } from 'src/app/core/services/rol.service';
import { ImplicitAutenticationService } from 'src/app/core/services/implicit_autentication.service';
import { TercerosCrudService } from 'src/app/core/services/terceros-crud.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';
import { accionesEjecucionFinal, accionesEjecucionPreliminar } from 'src/app/shared/utils/accionesPorRolYEstado';
import { AspectosEvaluadosComponent } from './aspectos-evaluados/aspectos-evaluados.component';
import { ResumenHallazgosComponent } from './resumen-hallazgos/resumen-hallazgos.component';
import { ModalVerDocumentoComponent } from 'src/app/shared/elements/components/dialogs/modal-ver-documento/modal-ver-documento.component';
import { Auditoria } from 'src/app/shared/data/models/auditoria';

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

  @ViewChildren("formularioDependenciasComp")
  formularioDependenciasComponent!: QueryList<FormularioDinamicoComponent>;
  formularioDependencias: Formulario = formularioDependencias;


  formInformacion: Formulario | undefined;
  formAspectosGenerales: FormGroup;
  formInformeFinal: FormGroup;
  formRespuestaPreliminar: FormGroup;

  informeId!: string;
  auditoriaId: string = '';
  informeData: any = null;
  auditoria: Auditoria | null = null;
  estadoId: number = 0;
  soloLectura: boolean = false;
  esLineal = false;
  orientation: "horizontal" | "vertical" = "horizontal";
  private stepInicial: number = 0;

  usuarioId: number = 0;
  usuarioRol: string = '';
  dependenciaIds: number[] = [];

  // Cuando el informe ya fue aprobado por el auditado -> Pasa a informe final
  get pasosInicialesSoloLectura(): boolean {
    return this.estadoId >= environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL;
  }

  /**
   * Muestra el paso de revisión del preinforme (paso 5) para:
   * - Auditados en estado REVISION_PREINFORME_AUDITADO (agregan sus observaciones)
   * - Auditores en estado CREANDO_INFORME_FINAL (agregan observaciones del auditor)
   */
  get esRevisionPreinformeAuditado(): boolean {
    const REVISION = environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO;
    const CREANDO_FINAL = environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL;
    const roles = this.rolService.getRoles();

    if (this.estadoId === REVISION) {
      return roles.some(r => r === environment.ROL.JEFE_DEPENDENCIA || r === environment.ROL.ASISTENTE_DEPENDENCIA);
    }

    if (this.estadoId === CREANDO_FINAL) {
      return roles.some(r => [
        environment.ROL.ADMIN, //TODO: QUITAR
        environment.ROL.AUDITOR_EXPERTO,
        environment.ROL.AUDITOR,
        environment.ROL.AUDITOR_ASISTENTE,
      ].includes(r));
    }

    return false;
  }

  /** Auditado puede escribir su observación solo en REVISION_PREINFORME_AUDITADO */
  get puedeEscribirObservacionAuditado(): boolean {
    if (this.estadoId !== environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO) return false;
    const roles = this.rolService.getRoles();
    return roles.some(r =>
      r === environment.ROL.JEFE_DEPENDENCIA || r === environment.ROL.ASISTENTE_DEPENDENCIA,
    );
  }

  /** Auditor puede escribir observación y marcar hallazgos en CREANDO_INFORME_FINAL */
  get puedeEscribirObservacionAuditor(): boolean {
    if (this.estadoId !== environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL) return false;
    const roles = this.rolService.getRoles();
    return roles.some(r => [
      environment.ROL.ADMIN, //TODO: QUITAR
      environment.ROL.AUDITOR_EXPERTO,
      environment.ROL.AUDITOR,
      environment.ROL.AUDITOR_ASISTENTE,
    ].includes(r));
  }

  /** Auditado puede terminar sus observaciones en REVISION_PREINFORME_AUDITADO */
  get puedeTerminarObservaciones(): boolean {
    if (this.estadoId !== environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO) return false;
    const roles = this.rolService.getRoles();
    return roles.some(r => r === environment.ROL.JEFE_DEPENDENCIA || r === environment.ROL.ASISTENTE_DEPENDENCIA);
  }

  /**
   * En el estado REVISION_PREINFORME_AUDITADO nadie puede editar temas/subtemas/hallazgos.
   * Se usa para bloquear los pasos iniciales independientemente de soloLectura.
   */
  get bloqueadoEnRevision(): boolean {
    return this.estadoId === environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO;
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
    private planAuditoriaMid: PlanAnualAuditoriaMid,
    private rolService: RolService,
    private autenticationService: ImplicitAutenticationService,
    private tercerosCrudService: TercerosCrudService,
    private userService: UserService,
    private readonly changeDetector: ChangeDetectorRef,
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
    this.soloLectura = this.route.snapshot.queryParamMap.get('soloLectura') === 'true';
    const stepParam = this.route.snapshot.queryParamMap.get('step');
    this.stepInicial = stepParam ? parseInt(stepParam, 10) : 0;
    this.cargarFormularios();
    this.manejarResponsiveStepper();
    this.informeId = this.route.snapshot.paramMap.get("id")!;
    this.cargarInforme();
    this.cargarUsuario();
  }

  private async cargarUsuario(): Promise<void> {
    try {
      const doc = await this.autenticationService.getDocument() as string | number;
      this.usuarioId = Number(doc);
      const rolPrioridad = [
        environment.ROL.JEFE_DEPENDENCIA,
        environment.ROL.ASISTENTE_DEPENDENCIA,
        environment.ROL.AUDITOR_EXPERTO,
        environment.ROL.AUDITOR,
        environment.ROL.AUDITOR_ASISTENTE,
      ];
      const roles = this.rolService.getRoles();
      this.usuarioRol = roles.find(r => rolPrioridad.includes(r)) ?? roles[0] ?? '';

      let cargoId: number | null = null;
      if (roles.includes(environment.ROL.JEFE_DEPENDENCIA)) {
        cargoId = environment.CARGO.JEFE_DEPENDENCIA_ID;
      } else if (roles.includes(environment.ROL.ASISTENTE_DEPENDENCIA)) {
        cargoId = environment.CARGO.ASISTENTE_DEPENDENCIA_ID;
      }

      if (cargoId !== null) {
        const personaId = await this.userService.getPersonaId();
        this.tercerosCrudService
          .get(`vinculacion?query=TerceroPrincipalId:${personaId},Activo:true,CargoId:${cargoId}&fields=DependenciaId`)
          .subscribe({
            next: (resp: any) => {
              this.dependenciaIds = (resp ?? [])
                .map((v: any) => v.DependenciaId)
                .filter((id: any) => id != null);
            },
            error: () => { this.dependenciaIds = []; },
          });
      }
    } catch (e) {
      console.error('Error al cargar datos del usuario:', e);
    }
  }

  ngAfterViewInit(): void {
    this.aplicarModoSoloLecturaPasosIniciales();
  }

  cargarFormularios(): void {
    this.formInformacion = formularioInformacionAuditoria;
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
        this.forzarSoloLecturaSegunPermisos();
        this.aplicarModoSoloLecturaPasosIniciales();
        if (this.stepInicial > 0) {
          setTimeout(() => { this.stepper.selectedIndex = this.stepInicial; }, 0);
        }
      },
      error: () => { }
    });
  }

  private forzarSoloLecturaSegunPermisos(): void {
    const esFlujoFinal = this.estadoId >= environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL;
    const accionEdicion = esFlujoFinal ? 'Editar Informe' : 'Editar Preinforme';
    const roles = this.rolService.getRoles();

    const puedeEditar = roles.some((rol) => {
      const acciones = esFlujoFinal
        ? accionesEjecucionFinal[rol]?.[this.estadoId] ?? []
        : accionesEjecucionPreliminar[rol]?.[this.estadoId] ?? [];
      return acciones.includes(accionEdicion);
    });

    if (!puedeEditar) {
      this.soloLectura = true;
    }
  }

  private aplicarModoSoloLecturaPasosIniciales(): void {
    const bloquearPasosIniciales =
      this.pasosInicialesSoloLectura || this.soloLectura || this.bloqueadoEnRevision;

    if (bloquearPasosIniciales) {
      this.formAspectosGenerales.disable({ emitEvent: false });
      if (this.formularioInformacionComponent?.form) {
        this.formularioInformacionComponent.form.disable({ emitEvent: false });
      }
    }

    if (this.soloLectura) {
      this.formRespuestaPreliminar.disable({ emitEvent: false });
      this.formInformeFinal.disable({ emitEvent: false });
    }
  }

  // Pobla los formularios con los datos del informe cargado
  poblarFormularios(): void {
    if (!this.informeData) return;

    this.auditoriaId = this.informeData.auditoria_id || '';

    // Poblar formulario de aspectos generales (paso 2)
    this.formAspectosGenerales.patchValue({
      aspecto_general: this.informeData.aspecto_general
    });

    // Poblar formulario de respuesta preliminar (paso 5/6)
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
  poblarFormularioInformacion(auditoria?: Auditoria): void {
    if (!this.formularioInformacionComponent) return;
    this.auditoria = auditoria || null;
    this.changeDetector.detectChanges();

    const valoresIniciales: any = {
      consecutivo_no_auditoria: auditoria?.consecutivo_no_auditoria,
      macroproceso: auditoria?.macroproceso_nombre,
      proceso: auditoria?.proceso_nombre,
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

    this.formularioDependenciasComponent.forEach((comp, i) => {
      const dep = auditoria?.datos_dependencias[i];
      console.log('Poblando dependencia:', dep);
      const correo = auditoria?.correo_complementario?.find((c: any) => c.dependencia_id === dep?.dependencia_id)?.correo || "";
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

  guardarRevisionAuditado(): void {
    // Las observaciones se guardan individualmente en el componente de revisión.
    this.stepper.next();
  }

  async terminarObservaciones(): Promise<void> {
    const confirmado = await this.alertaService.showConfirmAlert(
      "¿Está seguro(a) de terminar las observaciones del preinforme? Esta acción no se puede deshacer."
    );
    if (!confirmado.value) return;

    const auditoriaId = this.informeData?.auditoria_id;
    if (!auditoriaId) {
      this.alertaService.showErrorAlert("No fue posible identificar la auditoría.");
      return;
    }

    this.planAnualAuditoriaService.post('auditoria-estado', {
      auditoria_id: auditoriaId,
      fase_id: environment.AUDITORIA_FASE.EJECUCION_PRELIMINAR,
      estado_id: environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO,
      usuario_id: this.usuarioId,
      usuario_rol: this.usuarioRol,
      observacion: "",
    }).subscribe({
      next: () => {
        this.planAnualAuditoriaService.post('auditoria-estado', {
          auditoria_id: auditoriaId,
          fase_id: environment.AUDITORIA_FASE.EJECUCION_FINAL,
          estado_id: environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL,
          usuario_id: this.usuarioId,
          usuario_rol: this.usuarioRol,
          observacion: "",
        }).subscribe({
          next: () => {
            this.alertaService.showSuccessAlert("Las observaciones han sido registradas y enviadas al auditor.", "Observaciones enviadas");
            this.regresarRuta();
          },
          error: () => this.alertaService.showErrorAlert("Error al registrar el estado de informe final."),
        });
      },
      error: () => this.alertaService.showErrorAlert("Error al registrar las observaciones."),
    });
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
    if (!this.soloLectura) {
      modalInstance.botonGuardar = { icono: "save", texto: "Guardar documento" };
    }

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
