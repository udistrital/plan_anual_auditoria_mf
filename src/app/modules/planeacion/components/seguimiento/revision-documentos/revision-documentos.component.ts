import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ModalRechazoSeguimientoComponent } from "./modal-rechazo-seguimiento/modal-rechazo-seguimiento.component";
import { MatDialog } from "@angular/material/dialog";
import { TercerosService } from "src/app/shared/services/terceros.service";
import { NotificacionesService, DestinatariosEmail, VariablesSolicitud } from "src/app/shared/services/notificaciones.service";
import { NotificacionRegistroCrudService } from "src/app/core/services/notificacion-registro-crud.service";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { forkJoin, of, throwError } from "rxjs";
import { catchError, exhaustMap, switchMap, tap } from "rxjs/operators";
import { PLANTILLA_SOLICITUD_NOMBRE } from "src/app/core/services/notificaciones-mid.service";
import { environment } from "src/environments/environment";
import { documentos, rolesAprobacion } from "./revision-documentos.utilidades";


//Servicios
import { RolService } from "src/app/core/services/rol.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { UserService } from "src/app/core/services/user.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { Auditoria } from "src/app/shared/data/models/auditoria";

@Component({
    selector: "app-revision-documentos-seguimiento",
    templateUrl: "./revision-documentos.component.html",
    styleUrl: "./revision-documentos.component.css",
    standalone: false
})
export class RevisionDocumentosSeguimientoComponent implements OnInit {
  auditoriaId: string = "";
  estadoAuditoriaId!: number;
  tipoEvaluacionId!: number;
  tipoEvaluacion!: string;
  selectedTab: number = 0;
  opcionesDocumentos: any;
  role: string | null = null;
  rolauditoriaIdesAprobacion: any;
  rolesAprobacion: any;
  usuarioId: any;
  documentos: { base64: string; tipo_id: number }[] = [];
  docProgramaTrabajo: string = "";
  docSolicitudInformacion: string = "";
  docCartaPresentacion: string = "";
  docCompromisoEstico: string = "";
  mostrarBotones: boolean = false;
  mostrarBotonRechazo: boolean = false;

  constructor(
    public readonly dialog: MatDialog,
    private readonly alertService: AlertService,
    private readonly rolService: RolService,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService,
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly nuxeoService: NuxeoService,
    private readonly descargaService: DescargaService,
    private readonly tercerosService: TercerosService,
    private readonly notificacionesService: NotificacionesService,
    private readonly notificacionRegistroCrudService: NotificacionRegistroCrudService,
    private readonly parametrosUtilsService: ParametrosUtilsService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid
  ) {}

  ngOnInit(): void {
    this.inicializarDatos();
    this.cargarEstadoAuditoria();
  }

  inicializarDatos() {
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
    const tipoEvaluacionIdParam = this.route.snapshot.queryParamMap.get("tipoEvaluacionId");
    this.tipoEvaluacionId = Number(tipoEvaluacionIdParam ?? NaN) || environment.TIPO_EVALUACION.SEGUIMIENTO_ID; 
    this.tipoEvaluacion =
        this.tipoEvaluacionId === environment.TIPO_EVALUACION.INFORME_ID
        ? "informe"
        : "auditoria";

    this.opcionesDocumentos = documentos;
    this.rolesAprobacion = rolesAprobacion;
    this.obtenerRolPrioritario();
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
    });
    this.cargarDocumentos();
  }

  cargarEstadoAuditoria() {
    this.planAuditoriaService
      .get(
        `auditoria-estado?query=auditoria_id:${this.auditoriaId},actual:true`
      )
      .subscribe((res) => {
        this.estadoAuditoriaId =
          res.Data[0]?.estado_id ??
          environment.AUDITORIA_ESTADO.PROGRAMACION.BORRADOR_ID;

        if (this.role) {
          this.mostrarAcciones(this.role, this.estadoAuditoriaId);
        }
      });
  }

  preguntarAprobacionAuditoria() {
    const rolAprobacion = this.rolesAprobacion[this.role!];

    if (!rolAprobacion) {
      return; //si no hay rol
    }

    let { estadoAprobacion, mensajeAprobacion, preguntaAprobacion } =
      rolAprobacion;

    // At this point, the variables estadoAprobacion, mensajeAprobacion and
    // preguntaAprobacion are still objects with 'auditoria' and 'informe' properties.
    //estadoAprobacion = estadoAprobacion[this.tipoEvaluacion];
    mensajeAprobacion = mensajeAprobacion[this.tipoEvaluacion];
    preguntaAprobacion = preguntaAprobacion[this.tipoEvaluacion];

    this.alertService
      .showConfirmAlert(preguntaAprobacion)
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }

        if (Array.isArray(estadoAprobacion)) {
          // Si es un array como en el caso del rol jefe, para hacer dos post para el flujo de estados
          this.aprobarAuditoriaSecuencial(estadoAprobacion, mensajeAprobacion);
        } else {
          this.aprobarAuditoria(estadoAprobacion, mensajeAprobacion).then(() =>
            this.notificarAceptacionAuditado(this.auditoriaId)
          );
        }
      });
  }

  //funcion para registrar estados de auditoria secuencialmente,
  async aprobarAuditoriaSecuencial(
    estadoAprobacion: number[],
    mensajeAprobacion: string
  ) {
    try {
      for (const estado of estadoAprobacion) {
        await this.aprobarAuditoria(estado, mensajeAprobacion);
      }
      const ultimoEstado = estadoAprobacion[estadoAprobacion.length - 1];
      if (ultimoEstado === environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO) {
        this.notificarEnvioAuditado(this.auditoriaId);
      }
    } catch (error) {
      this.alertService.showErrorAlert("Error al aprobar el plan.");
    }
  }


  /**
   * Notifica a los actores de cada dependencia asociada a la auditoría (correo_dependencia,
   * jefe_correo, asistente_correo y correo_complementario si existe) cuando el Jefe OCI
   * aprueba y envía el programa de auditoría a revisión del auditado en seguimiento.
   * Los auditores asignados reciben copia (Cc).
   *
   * Los correos se resuelven desde `datos_dependencias`, que soporta múltiples dependencias
   * por auditoría. Los campos opcionales (jefe, asistente, complementario) solo se incluyen
   * si el MID los retorna.
   */
  private notificarEnvioAuditado(auditoriaId: string): void {
    const rolRemitente = "Jefe OCI";

    this.tercerosService.getAuthenticatedUserTerceroIdentification().pipe(

      exhaustMap((tercero) => {
        return forkJoin({
          auditoria: this.planAuditoriaMid.get(`auditoria/${auditoriaId}`),
          auditores: this.planAuditoriaService.get(
            `auditor?query=auditoria_id:${auditoriaId},asignado:true,activo:true&limit=0`
          ),
          vigencias: this.parametrosUtilsService.getVigencias(),
          nombreRemitente: of(tercero.NombreCompleto),
        });
      }),

      exhaustMap(({ auditoria, auditores, vigencias, nombreRemitente }: any) => {
        const datosAuditoria: Auditoria = auditoria?.Data;
        const listaAuditores: any[] = auditores?.Data ?? [];
        const dependenciasInfo: any[] = datosAuditoria?.datos_dependencias ?? [];
        dependenciasInfo.forEach((dep) => 
          datosAuditoria.correo_complementario?.forEach((correo: any) => {
            if (correo.dependencia_id === dep.dependencia_id)
              dep.correo_complementario = correo.correo;
          })
        );

        const vigenciaId = datosAuditoria?.vigencia_id;
        const vigenciaObj = vigencias.find((v: any) => v.Id === vigenciaId);
        const vigenciaNombre = vigenciaObj?.Nombre || (vigenciaId ? String(vigenciaId) : "");

        console.log(
          "[notificarEnvioAuditado - SEGUIMIENTO] auditoriaId:", auditoriaId,
          "vigenciaId:", vigenciaId
        );
        console.log(
          "[notificarEnvioAuditado - SEGUIMIENTO] dependencias_info recibidas:",
          JSON.stringify(dependenciasInfo, null, 2)
        );

        const correosAuditores$ = listaAuditores.length > 0
          ? forkJoin(
            listaAuditores.map((a: any) =>
              this.tercerosService.getTerceroById(a.auditor_id).pipe(
                catchError(() => of(null))
              )
            )
          )
          : of([]);

        return correosAuditores$.pipe(
          switchMap((terceros: any[]) => {
            const correosAuditores = terceros
              .filter((t) => t?.UsuarioWSO2)
              .map((t) => t.UsuarioWSO2)
              .filter((v: string) => v.includes('@'));

            const toAddressesDinamicos: string[] = dependenciasInfo.flatMap((dep) => {
              const correos: string[] = [];
              if (dep.correo_dependencia)    correos.push(dep.correo_dependencia);
              if (dep.jefe_correo)           correos.push(dep.jefe_correo);
              if (dep.asistente_correo)      correos.push(dep.asistente_correo);
              if (dep.correo_complementario) correos.push(dep.correo_complementario);
              return correos;
            });

            console.log(
              "[notificarEnvioAuditado - SEGUIMIENTO] ToAddresses dinámicos:",
              toAddressesDinamicos
            );
            console.log(
              "[notificarEnvioAuditado - SEGUIMIENTO] Cc auditores:",
              correosAuditores
            );

            const fijosEnvioAuditado = environment.NOTIFICACION_PROGRAMA_TRABAJO_ENVIO_AUDITADO_DESTINATARIOS;
            const destinatarios: DestinatariosEmail = {
              ToAddresses: [
                ...toAddressesDinamicos,
                ...(fijosEnvioAuditado.ToAddresses ?? []),
              ],
              CcAddresses: [
                ...correosAuditores,
                ...(fijosEnvioAuditado.CcAddresses ?? []),
              ],
              BccAddresses: fijosEnvioAuditado.BccAddresses ?? [],
            };

            console.log(
              "[notificarEnvioAuditado - SEGUIMIENTO] Payload final destinatarios:",
              JSON.stringify(destinatarios, null, 2)
            );

            const variablesSolicitud: VariablesSolicitud = {
              titulo_solicitud: "Revisión de Programa de Auditoría",
              tipo_solicitud: "revisión y firma",
              nombre_documento: `Programa de Auditoría${datosAuditoria?.titulo ? ' - ' + datosAuditoria.titulo : ''}`,
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
                  console.log("[notificarEnvioAuditado - SEGUIMIENTO] Notificación enviada exitosamente");
                  this.registrarNotificacion(
                    auditoriaId,
                    destinatarios,
                    variablesSolicitud,
                    "envio_revision_auditado_programa_trabajo"
                  );
                }
              })
            );
          })
        );
      }),

      catchError((error) => {
        console.warn("[notificarEnvioAuditado - SEGUIMIENTO] Error al notificar envío a auditado:", error);
        console.warn("Status:", error?.status);
        console.warn("Body:", JSON.stringify(error?.error));
        return throwError(() => error);
      })

    ).subscribe({
      error: (err) => console.warn("[notificarEnvioAuditado - SEGUIMIENTO] Error suscripción:", err),
    });
  }


  /**
   * Notifica a los auditores asignados cuando el auditado (Jefe o Asistente de Dependencia)
   * firma y carga/acepta la auditoría de seguimiento con documentos.
   * Los auditores reciben el correo en To, la dependencia auditada en Cc.
   */
  private notificarAceptacionAuditado(auditoriaId: string): void {
    const rolRemitente = "Dependencia Auditada";

    this.tercerosService.getAuthenticatedUserTerceroIdentification().pipe(

      exhaustMap((tercero) => {
        return forkJoin({
          auditoria: this.planAuditoriaMid.get(`auditoria/${auditoriaId}`),
          auditores: this.planAuditoriaService.get(
            `auditor?query=auditoria_id:${auditoriaId},asignado:true,activo:true&limit=0`
          ),
          vigencias: this.parametrosUtilsService.getVigencias(),
          nombreRemitente: of(tercero.NombreCompleto),
        });
      }),

      exhaustMap(({ auditoria, auditores, vigencias, nombreRemitente }: any) => {
        const datosAuditoria = auditoria?.Data;
        const listaAuditores: any[] = auditores?.Data ?? [];
        const dependenciasInfo: any[] = datosAuditoria?.datos_dependencias ?? [];

        const vigenciaId = datosAuditoria?.vigencia_id;
        const vigenciaObj = vigencias.find((v: any) => v.Id === vigenciaId);
        const vigenciaNombre = vigenciaObj?.Nombre || (vigenciaId ? String(vigenciaId) : "");

        console.log(
          "[notificarAceptacionAuditado - SEGUIMIENTO] auditoriaId:", auditoriaId,
          "dependencias_info recibidas:",
          JSON.stringify(dependenciasInfo, null, 2)
        );

        const correosAuditores$ = listaAuditores.length > 0
          ? forkJoin(
              listaAuditores.map((a: any) =>
                this.tercerosService.getTerceroById(a.auditor_id).pipe(
                  catchError(() => of(null))
                )
              )
            )
          : of([]);

        return correosAuditores$.pipe(
          switchMap((terceros: any[]) => {
            // Auditores van al To
            const correosAuditores = terceros
              .filter((t) => t?.UsuarioWSO2)
              .map((t) => t.UsuarioWSO2)
              .filter((v: string) => v.includes('@'));

            // Dependencia auditada va al Cc
            const correosDependencia: string[] = dependenciasInfo.flatMap((dep) => {
              const correos: string[] = [];
              if (dep.correo_dependencia)    correos.push(dep.correo_dependencia);
              if (dep.jefe_correo)           correos.push(dep.jefe_correo);
              if (dep.asistente_correo)      correos.push(dep.asistente_correo);
              if (dep.correo_complementario) correos.push(dep.correo_complementario);
              return correos;
            });

            console.log(
              "[notificarAceptacionAuditado - SEGUIMIENTO] To auditores:",
              correosAuditores
            );
            console.log(
              "[notificarAceptacionAuditado - SEGUIMIENTO] Cc dependencia:",
              correosDependencia
            );

            const fijos = environment.NOTIFICACION_ACEPTACION_AUDITADO_DESTINATARIOS;
            const destinatarios: DestinatariosEmail = {
              ToAddresses: [
                ...correosAuditores,
                ...(fijos?.ToAddresses ?? []),
              ],
              CcAddresses: [
                ...correosDependencia,
                ...(fijos?.CcAddresses ?? []),
              ],
              BccAddresses: fijos?.BccAddresses ?? [],
            };

            console.log(
              "[notificarAceptacionAuditado - SEGUIMIENTO] Payload final destinatarios:",
              JSON.stringify(destinatarios, null, 2)
            );

            const variablesCartaRepresentacion: any = {
              dependencia:        dependenciasInfo[0]?.dependencia_nombre ?? "",
              tipo_auditoria:     datosAuditoria?.titulo ?? "",
              vigencia:           vigenciaNombre,
              nombre_quien_envia: nombreRemitente || rolRemitente,
              fecha_envio:        new Date().toLocaleDateString(),
            };

            return this.notificacionesService.enviarNotificacionCartaRepresentacion(
              destinatarios,
              variablesCartaRepresentacion
            ).pipe(
              tap((response: any) => {
                if (response?.Status == 200) {
                  console.log("[notificarAceptacionAuditado - SEGUIMIENTO] Notificación enviada exitosamente");
                  this.registrarNotificacion(
                    auditoriaId,
                    destinatarios,
                    variablesCartaRepresentacion,
                    "aceptacion_auditado_cargue_documento"
                  );
                }
              })
            );
          })
        );
      }),

      catchError((error) => {
        console.warn("[notificarAceptacionAuditado - SEGUIMIENTO] Error al notificar aceptación:", error);
        console.warn("Status:", error?.status);
        console.warn("Body:", JSON.stringify(error?.error));
        return throwError(() => error);
      })

    ).subscribe({
      error: (err) => console.warn("[notificarAceptacionAuditado - SEGUIMIENTO] Error suscripción:", err),
    });
  }


  /**
   * Registra un log de notificación enviada en el CRUD de notificaciones (MongoDB).
   */
  private registrarNotificacion(
    auditoriaId: string,
    destinatarios: DestinatariosEmail,
    variables: any,
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
      referencia_tipo: 'AUDITORIA SEGUIMIENTO',
    };

    this.notificacionRegistroCrudService.post(payload).subscribe({
      next: (res) => console.debug("[registrarNotificacion - SEGUIMIENTO] Registro guardado:", res),
      error: (err) => console.warn("[registrarNotificacion - SEGUIMIENTO] Error guardando:", err),
    });
  }

  async aprobarAuditoria(estadoAprobacion: number, mensajeAprobacion: string) {
    try {
      const auditoriaEstado =
        this.construirObjetoAuditoriaEstado(estadoAprobacion);

      this.planAuditoriaService
        .post("auditoria-estado", auditoriaEstado)
        .subscribe(() => {
          this.alertService.showSuccessAlert(
            mensajeAprobacion,
            "Auditoría enviada"
          ).then(() => {
            this.router.navigate([`/planeacion/seguimiento`]);
          });
        });
    } catch (error) {
      this.alertService.showErrorAlert("Error al aprobar el plan.");
    }
  }

  construirObjetoAuditoriaEstado(estadoAprobacion: number) {
    return {
      auditoria_id: this.auditoriaId,
      usuario_id: this.usuarioId,
      usuario_rol: this.role,
      observacion: "",
      estado_id: estadoAprobacion,
      fase_id: environment.AUDITORIA_FASE.PLANEACION,
    };
  }

  abrirModalRechazo(): void {
    this.dialog.open(ModalRechazoSeguimientoComponent, {
      width: "50%",
      data: {
        usuarioId: this.usuarioId,
        role: this.role,
        auditoriaId: this.auditoriaId,
        tipoEvaluacionId: this.tipoEvaluacionId,
      },
    });
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }

  regresarRuta() {
    this.router.navigate([`/planeacion/seguimiento`]);
  }

  obtenerRolPrioritario() {
    this.role = this.rolService.getRolPrioritario([
      environment.ROL.SECRETARIO,
      environment.ROL.AUDITOR_EXPERTO,
      environment.ROL.AUDITOR,
      environment.ROL.AUDITOR_ASISTENTE,
      environment.ROL.JEFE,
      environment.ROL.JEFE_DEPENDENCIA,
      environment.ROL.ASISTENTE_DEPENDENCIA,
    ]);
  }

  mostrarAcciones(role: string, estadoAuditoriaId: number): void {
    const condicionesVisibilidad: { [key: string]: number[] } = {
      [environment.ROL.JEFE]: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE],
      [environment.ROL.JEFE_DEPENDENCIA]: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO],
      [environment.ROL.ASISTENTE_DEPENDENCIA]: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO]
    };
    // retorna true, si el rol coincide con el estado de revision del rol
    this.mostrarBotones = condicionesVisibilidad[role]?.includes(estadoAuditoriaId) || false;
    this.mostrarBotonRechazo = this.mostrarBotones && this.role === environment.ROL.JEFE;
  }

  cargarDocumentos() {
    this.referenciaPdfService
      .consultarDocumentos(this.auditoriaId)
      .subscribe(async (res) => {
        const promesas = res.map(async (documento) => {
          const base64 = await this.nuxeoService.obtenerPorUUID(documento.nuxeo_enlace);
          this.documentos.push({ base64, tipo_id: documento.tipo_id });
        });

        await Promise.all(promesas);
      });
  }

  /**
   * Gets the base64 string of a document by its type ID as defined in the
   * environment variables. 
   * 
   * @param key The key corresponding to the document type in the environment
   *            variables (e.g., "SOLICITUD_INFORMACION").
   * @returns The base64 string of the document if found; otherwise, an empty string.
   */
  getDocumentoBase64ByTIPO(key: string): string {
    const tipoId = environment.TIPO_DOCUMENTO_PARAMETROS[
          key as keyof typeof environment.TIPO_DOCUMENTO_PARAMETROS
        ];
    
    return this.documentos.find(doc => doc.tipo_id === tipoId)?.base64 ?? '';
  }

  async descargarTodo() {
    try {
      await this.descargaService.descargarMultiplesArchivos(
        this.documentos,
        "documentosAuditoria.zip"
      );
    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error);
    }
  }

}
