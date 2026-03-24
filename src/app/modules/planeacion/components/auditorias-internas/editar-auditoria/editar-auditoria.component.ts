import { Component, OnInit, ViewChild } from "@angular/core";
import { MatStepper } from "@angular/material/stepper";
import { ActividadesAuditoriaComponent } from "./actividades-auditoria/actividades-auditoria.component";
import { Formulario } from "src/app/shared/data/models/formulario.model";
import {
  formularioInformacionAuditoria,
  formularioRecursosAuditoria,
  formularioTemasAuditoria,
} from "./editar-auditoria.utilidades";
import { BreakpointObserver } from "@angular/cdk/layout";
import { AlertService } from "src/app/shared/services/alert.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { FormularioDinamicoComponent } from "src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component";
import { Router, ActivatedRoute } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { CargarArchivoComponent } from "src/app/shared/elements/components/cargar-archivo/cargar-archivo.component";
import { environment } from "src/environments/environment";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { Auditoria } from "src/app/shared/data/models/auditoria";
import { CrearActividadComponent } from "./actividades-auditoria/crear-actividad/crear-actividad.component";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { establecerSelectsSecuenciales } from "src/app/shared/utils/formularios";
import { UserService } from "src/app/core/services/user.service";
import { RolService } from "src/app/core/services/rol.service";
import { forkJoin, of, throwError } from "rxjs";
import { catchError, exhaustMap, tap } from "rxjs/operators";
import { TercerosService } from "src/app/shared/services/terceros.service";
import {
  NotificacionesService,
  DestinatariosEmail,
  VariablesSolicitud,
} from "src/app/shared/services/notificaciones.service";
import { NotificacionRegistroCrudService } from "src/app/core/services/notificacion-registro-crud.service";
import { PLANTILLA_SOLICITUD_NOMBRE } from "src/app/core/services/notificaciones-mid.service";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
@Component({
  selector: "app-editar-auditoria",
  templateUrl: "./editar-auditoria.component.html",
  styleUrls: ["./editar-auditoria.component.css"],
})
export class EditarAuditoriaComponent implements OnInit {
  @ViewChild("stepper") stepper!: MatStepper;

  @ViewChild(ActividadesAuditoriaComponent)
  registroPlan!: ActividadesAuditoriaComponent;

  @ViewChild("formularioInformacionComp")
  formularioInformacionComponent!: FormularioDinamicoComponent;
  formularioInformacion: Formulario | undefined;

  @ViewChild("formularioRecursosComp")
  formularioRecursosComponent!: FormularioDinamicoComponent;
  formularioRecursos: Formulario | undefined;

  @ViewChild("formularioTemasComp")
  formularioTemasComponent!: FormularioDinamicoComponent;
  formularioTemas: Formulario | undefined;

  auditoriaId!: string;
  auditoria!: Auditoria;
  esLineal = false;
  orientation: "horizontal" | "vertical" = "horizontal";
  tipoSeleccionado: "macroproceso" | "proceso" | null = null;
  procesoElegido = 0;
  usuarioId: number = 0;
  paso1Guardado: boolean = false;
  paso3Guardado: boolean = false;
  tipoDocumentoParametros = environment.TIPO_DOCUMENTO_PARAMETROS;
  auditoriaEstados = environment.AUDITORIA_ESTADO;

  constructor(
    private readonly alertaService: AlertService,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly dialog: MatDialog,
    private readonly parametrosService: ParametrosService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly userService: UserService,
    private readonly rolService: RolService,
    private readonly tercerosService: TercerosService,
    private readonly notificacionesService: NotificacionesService,
    private readonly notificacionRegistroCrudService: NotificacionRegistroCrudService,
    private readonly parametrosUtilsService: ParametrosUtilsService,
  ) {}

  ngOnInit() {
    this.cargarFormularios();
    this.manejarResponsiveStepper();
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
    this.obtenerAuditoria(this.auditoriaId);
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
    });
  }

  ngAfterViewInit() {
    this.stepper.selectionChange.subscribe((event) => {
      if (event.previouslySelectedIndex === 3 && event.selectedIndex !== 3) {
        this.registroPlan.onStepLeave();
      }
    });

    establecerSelectsSecuenciales(this.formularioInformacionComponent, [
      "proceso",
    ]);
  }

  obtenerAuditoria(auditoriaId: string) {
    this.planAuditoriaMid.get(`auditoria/${auditoriaId}`).subscribe((res) => {
      this.auditoria = res.Data;
      this.cargarFormulariosConAuditoria();
    });
  }

  cargarFormularios(): void {
    this.formularioInformacion = formularioInformacionAuditoria;
    this.formularioRecursos = formularioRecursosAuditoria;
    this.formularioTemas = formularioTemasAuditoria;
  }

  enviarFormInformacion() {
    this.formularioInformacionComponent.onSubmit();
  }

  cambiarEstado() {
    const estadoPayload = {
      auditoria_id: this.auditoria._id,
      estado_id: environment.AUDITORIA_ESTADO.PLANEACION.CREANDO_PROGRAMA,
      fase_id: environment.AUDITORIA_FASE.PLANEACION,
      usuario_id: this.usuarioId,
      usuario_rol: [environment.ROL.AUDITOR_EXPERTO, environment.ROL.AUDITOR, environment.ROL.AUDITOR_ASISTENTE].find(rol => this.rolService.tieneRol(rol))
    }
    return this.planAuditoriaService.post("auditoria-estado", estadoPayload)
  }

  preguntarGuardadoInformacion(dataForm: any) {
    if (!dataForm) {
      return this.alertaService.showAlert(
        "Formulario incompleto",
        "Debe llenar todos los campos obligatorios"
      );
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
    const auditoriaId = this.auditoria._id;
    const informacionEditar = this.mapearInfoFormInformacion(informacion);

    this.planAuditoriaService
      .put(`auditoria/${auditoriaId}`, informacionEditar)
      .subscribe((res) => {
        if (this.auditoria.estado_id !== environment.AUDITORIA_ESTADO.PLANEACION.CREANDO_PROGRAMA) {
          this.cambiarEstado().subscribe(() => {
            this.auditoria.estado_id = environment.AUDITORIA_ESTADO.PLANEACION.CREANDO_PROGRAMA;
            this.alertaService.showSuccessAlert(
              "Información editada correctamente"
            );
          });
        }
        this.paso1Guardado = true;
        this.stepper.next();
      });
  }

  mapearInfoFormInformacion(informacion: any) {
    return {
      alcance: informacion.alcance_auditoria,
      consecutivo_IE: informacion.consecutivo_IE,
      consecutivo_OCI: informacion.consecutivo_OCI,
      criterio: informacion.criterios,
      fecha_fin: informacion.fecha_ejecucion_final,
      fecha_inicio: informacion.fecha_ejecucion_inicial,
      consecutivo_no_auditoria: informacion.consecutivo_no_auditoria,
      objetivo: informacion.objetivo_auditoria,
      correo_complementario: informacion.correo_complementario,
    };
  }

  enviarFormRecursos() {
    this.formularioRecursosComponent.onSubmit();
    this.formularioTemasComponent.onSubmit();
  }

  preguntarGuardadoRecursos(dataForm: any) {
    if (!dataForm || !this.formularioTemasComponent.form.valid) {
      return this.alertaService.showAlert(
        "Formulario incompleto",
        "Debe llenar todos los campos obligatorios"
      );
    }

    this.alertaService
      .showConfirmAlert("¿Está seguro(a) de guardar los recursos y temas?")
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }
        this.guardarRecursos(dataForm);
      });
  }

  guardarRecursos(recursos: any) {
    const auditoriaId = this.auditoria._id;
    const recursosEditar = {
      rec_tecnologico: recursos.tecnologicos,
      rec_humano: recursos.humanos,
      rec_fisico: recursos.fisicos,
      temas: this.formularioTemasComponent.form.value.temas,
    };

    this.planAuditoriaService
      .put(`auditoria/${auditoriaId}`, recursosEditar)
      .subscribe((res) => {
        if (this.auditoria.estado_id !== environment.AUDITORIA_ESTADO.PLANEACION.CREANDO_PROGRAMA) {
          this.cambiarEstado().subscribe(() => {
            this.auditoria.estado_id = environment.AUDITORIA_ESTADO.PLANEACION.CREANDO_PROGRAMA;
            this.alertaService.showSuccessAlert("Recursos editados correctamente");
          });
        }
        this.paso3Guardado = true;
        this.stepper.next();
      });
  }

  finalizarAuditoria(): void {
    if (!this.paso1Guardado || !this.paso3Guardado) {
      return this.alertaService.showAlert(
        "Formulario incompleto",
        "Debe guardar todos los pasos del formulario antes de enviar (Paso 1: Información y Paso 3: Recursos)"
      );
    }

    this.alertaService
      .showConfirmAlert("¿Está seguro(a) de enviar el formulario?")
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }
        this.validarDocumentosAnexados(this.auditoria._id);
      });
  }

  manejarEnvioDocumentos(documentos: any) {
    this.stepper.next();
  }

  manejarResponsiveStepper() {
    this.breakpointObserver
      .observe(["(max-width: 992px)"])
      .subscribe((result) => {
        this.orientation = result.matches ? "vertical" : "horizontal";
      });
  }

  regresarRuta() {
    this.router.navigate([`/planeacion/auditorias-internas`]);
  }

  subirArchivoCargueMasivo(): void {
    const dialogRef = this.dialog.open(CargarArchivoComponent, {
      width: "800px",
      data: {
        tipoArchivo: "xlsx",
        id: this.auditoriaId,
        idTipoDocumento: environment.TIPO_DOCUMENTO.PLANES_AUDITORIA,
        descripcion: "Archivo para cargue masivo de actividades de auditoría interna",
        cargaLambda: true,
        tipo: "actividades",
        referencia: "Plan Auditoria",
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      if (this.registroPlan) {
        this.registroPlan.listaractividades();
      }
    });
  }

  cargarFormulariosConAuditoria() {
    this.formularioInformacionComponent.form.patchValue({
      consecutivo_no_auditoria: this.auditoria.consecutivo_no_auditoria,
      consecutivo_OCI: this.auditoria.consecutivo_OCI,
      consecutivo_IE: this.auditoria.consecutivo_IE,
      macroproceso: this.auditoria.macroproceso_nombre,
      proceso: this.auditoria.proceso_nombre,
      dependencia: this.auditoria.dependencia_nombre,
      jefe_nombre: this.auditoria.jefe_nombre,
      asistente_nombre: this.auditoria.asistente_nombre,
      fecha_ejecucion_inicial: this.auditoria.fecha_inicio,
      fecha_ejecucion_final: this.auditoria.fecha_fin,
      objetivo_auditoria: this.auditoria.objetivo,
      alcance_auditoria: this.auditoria.alcance,
      criterios: this.auditoria.criterio,
      jefe_correo: this.auditoria.jefe_correo,
      asistente_correo: this.auditoria.asistente_correo,
      correo_dependencia: this.auditoria.correo_dependencia,
      correo_complementario: this.auditoria.correo_complementario,
    });

    this.formularioRecursosComponent.form.patchValue({
      tecnologicos: this.auditoria.rec_tecnologico,
      humanos: this.auditoria.rec_humano,
      fisicos: this.auditoria.rec_fisico,
    });

    this.formularioTemasComponent.form.patchValue({
      tema: this.auditoria.tema,
    });
  }

  crearActividad() {
    const dialogRef = this.dialog.open(CrearActividadComponent, {
      width: "1100px",
      data: { auditoriaId: this.auditoriaId },
    });

    dialogRef.afterClosed().subscribe(() => {
      if (this.registroPlan) {
        this.registroPlan.listaractividades();
      }
    });
  }

  private readonly selectActions: Record<string, (valor: any) => void> = {
    macroproceso: (valor) => this.manejarCambioMacroproceso(valor),
  };

  manejarCambioSelect(event: any): void {
    this.selectActions[event.campo.nombre]?.(event.valor);
  }

  manejarCambioMacroproceso(tipoProcesoId: any) {
    const { MACROPROCESO, PROCESO } =
      environment.INFO_AUDITORIA.TIPOS_PROCESO.VALORES;

    this.tipoSeleccionado = null;
    if (tipoProcesoId === MACROPROCESO.PARAMETRO_ID) {
      this.tipoSeleccionado = "macroproceso";
    } else if (tipoProcesoId === PROCESO.PARAMETRO_ID) {
      this.tipoSeleccionado = "proceso";
    }

    const tipoParametroId =
      this.tipoSeleccionado === "macroproceso"
        ? MACROPROCESO.TIPO_PARAMETRO_ID
        : PROCESO.TIPO_PARAMETRO_ID;

    this.cargarOpciones("proceso", tipoParametroId);
  }

  cargarOpciones(campoNombre: string, tipoParametroId: number) {
    this.parametrosService
      .get(
        `parametro?query=TipoParametroId:${tipoParametroId}&fields=Id,Nombre&limit=0&sortby=Nombre&order=asc`
      )
      .subscribe((res) => {
        const campo = this.obtenerCampoFormulario(campoNombre);
        if (campo) campo.parametros!.opciones = res.Data;
      });
  }

  obtenerCampoFormulario(nombreCampo: string) {
    return this.formularioInformacion?.campos?.find(
      (campo) => campo.nombre === nombreCampo
    );
  }

  validarDocumentosAnexados(auditoriaId: any) {
    const docs = [
      { tipo: this.tipoDocumentoParametros.PROGRAMA_TRABAJO, nombre: 'programa de auditoría' },
      { tipo: this.tipoDocumentoParametros.SOLICITUD_INFORMACION, nombre: 'solicitud de información' },
      { tipo: this.tipoDocumentoParametros.CARTA_PRESENTACION, nombre: 'carta de representación' },
      { tipo: this.tipoDocumentoParametros.COMPROMISO_ETICO, nombre: 'compromiso ético' }
    ];

    const requests = docs.map(d =>
      this.planAuditoriaService.get(
        `documento?query=referencia_id:${auditoriaId},tipo_id:${d.tipo},activo:true`
      )
    );

    forkJoin(requests).subscribe({
      next: (responses) => {
        for (let i = 0; i < responses.length; i++) {
          if (!responses[i] || responses[i].Data.length === 0) {
            this.alertaService.showErrorAlert(
              `No se ha encontrado el documento de  ${docs[i].nombre}. Por favor, asegúrese de subir todos los documentos requeridos antes de enviar a aprobación por Jefe.`
            );
            return;
          }
        }
        this.enviarAprobacionPorJefe(auditoriaId);
      },
      error: (error) => {
        console.error(error);
        this.alertaService.showErrorAlert("Error validando los documentos.");
      }
    });
  }

  enviarAprobacionPorJefe(auditoriaId: string) {
    const auditoriaEstado = {
      auditoria_id: auditoriaId,
      usuario_id: this.usuarioId,
      usuario_rol: [environment.ROL.AUDITOR_EXPERTO, environment.ROL.AUDITOR, environment.ROL.AUDITOR_ASISTENTE].find(rol => this.rolService.tieneRol(rol)),
      observacion: "",
      estado_id: this.auditoriaEstados.PLANEACION.REVISION_PROGRAMA_JEFE,
      fase_id: environment.AUDITORIA_FASE.PLANEACION,
    };

    this.planAuditoriaService
      .post("auditoria-estado", auditoriaEstado)
      .subscribe({
        next: () => {
          this.alertaService.showSuccessAlert(
            "Auditoría enviada a revisión del programa por Jefe",
            "Auditoría enviada"
          );
          this.notificarEnvioAJefe(auditoriaId);
          this.regresarRuta();
        },
        error: (error) => {
          this.alertaService.showErrorAlert("Error al enviar el programa.");
          console.error(error);
        }
    });
  }

    /**
   * Notifica al Jefe OCI cuando un auditor envía el programa de auditoría a revisión.
   * Patrón: getAuthenticatedUserTerceroIdentification() primero y sola,
   * luego forkJoin con auditoria.
   */
  
  private notificarEnvioAJefe(auditoriaId: string): void {
    const rolRemitente = [
      environment.ROL.AUDITOR_EXPERTO,
      environment.ROL.AUDITOR,
      environment.ROL.AUDITOR_ASISTENTE,
    ].find(rol => this.rolService.tieneRol(rol)) || "Auditor";

    this.tercerosService.getAuthenticatedUserTerceroIdentification().pipe(

      exhaustMap((tercero) =>
        forkJoin({
          auditoria: this.planAuditoriaService.get(`auditoria/${auditoriaId}`),
          vigencias: this.parametrosUtilsService.getVigencias(),
          nombreRemitente: of(tercero.NombreCompleto),
        })
      ),

      exhaustMap(({ auditoria, vigencias, nombreRemitente }: any) => {
        const datosAuditoria = auditoria?.Data;

        const vigenciaId = datosAuditoria?.vigencia_id;
        const vigenciaObj = vigencias.find((v: any) => v.Id === vigenciaId);
        const vigenciaNombre = vigenciaObj?.Nombre || (vigenciaId ? String(vigenciaId) : "");

        const destinatarios: DestinatariosEmail = this.tercerosService.combinarDestinatarios(
          [],
          environment.NOTIFICACION_PROGRAMA_TRABAJO_ENVIO_JEFE_DESTINATARIOS
        );

        const variablesSolicitud: VariablesSolicitud = {
          titulo_solicitud: "Revisión de Programa de Auditoría",
          tipo_solicitud: "revisión y aprobación",
          nombre_documento: `Programa de Auditoría${datosAuditoria?.titulo ? ` - ${datosAuditoria.titulo}` : ''}`,
          vigencia: vigenciaNombre,
          rol_remitente: rolRemitente,
          nombre_remitente: nombreRemitente || rolRemitente,
          fecha_envio: new Date().toLocaleDateString(),
        };

        return this.notificacionesService.enviarNotificacionSolicitud(
          destinatarios,
          variablesSolicitud
        ).pipe(
          tap((response: any) => {
            if (response?.Status == 200) {
              this.registrarNotificacion(
                auditoriaId,
                destinatarios,
                variablesSolicitud,
                "envio_revision_jefe_programa_trabajo"
              );
            }
          })
        );
      }),

      catchError((error) => {
        console.warn("Error al enviar notificación al Jefe OCI:", error);
        return throwError(() => error);
      })

    ).subscribe({
      error: (err) => console.warn("Error en notificación envío a Jefe:", err),
    });
  }

  private registrarNotificacion(
    auditoriaId: string,
    destinatarios: DestinatariosEmail,
    variables: VariablesSolicitud,
    tipoNotificacion: string,
    template: string = PLANTILLA_SOLICITUD_NOMBRE,
  ): void {
    const payload = {
      plantilla: template,
      fecha_envio: new Date(),
      metadato: {
        ...variables,
        tipo_notificacion: tipoNotificacion,
        destinatarios_to: destinatarios.ToAddresses ?? [],
        destinatarios_cc: destinatarios.CcAddresses ?? [],
        destinatarios_bcc: destinatarios.BccAddresses ?? [],
      },
      referencia_id: auditoriaId,
      referencia_tipo: 'AUDITORIA INTERNA',
    };

    this.notificacionRegistroCrudService.post(payload).subscribe({
      next: (res) => console.debug("Registro de notificación guardado:", res),
      error: (err) => console.warn("Error guardando registro de notificación:", err),
    });
  }
}