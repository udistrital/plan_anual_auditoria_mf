import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ModalRechazoAuditoriaComponent } from "./modal-rechazo-auditoria/modal-rechazo-auditoria.component";
import { MatDialog } from "@angular/material/dialog";
import { environment } from "src/environments/environment";
import { documentos, rolesAprobacion } from "./revision-documentos.utilidades";

// Servicios
import { RolService } from "src/app/core/services/rol.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { UserService } from "src/app/core/services/user.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { TercerosService } from "src/app/shared/services/terceros.service";
import {
  NotificacionesService,
  DestinatariosEmail,
  VariablesSolicitud,
} from "src/app/shared/services/notificaciones.service";
import { NotificacionRegistroCrudService } from "src/app/core/services/notificacion-registro-crud.service";
import { PLANTILLA_SOLICITUD_NOMBRE } from "src/app/core/services/notificaciones-mid.service";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { forkJoin, of, throwError } from "rxjs";
import { catchError, exhaustMap, switchMap, tap } from "rxjs/operators";

@Component({
  selector: "app-revision-documentos",
  templateUrl: "./revision-documentos.component.html",
  styleUrl: "./revision-documentos.component.css",
})
export class RevisionDocumentosComponent implements OnInit {
  auditoriaId: string = "";
  estadoAuditoriaId!: number;
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
  docCompromisoEtico: string = "";

  constructor(
    public dialog: MatDialog,
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
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
  ) {}

  ngOnInit(): void {
    this.inicializarDatos();
    this.cargarEstadoAuditoria();
  }

  inicializarDatos() {
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
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
      });
  }

  preguntarAprobacionAuditoria() {
    const rolAprobacion = this.rolesAprobacion[this.role!];

    if (!rolAprobacion) {
      return;
    }

    const { estadoAprobacion, mensajeAprobacion, preguntaAprobacion } =
      rolAprobacion;

    this.alertService
      .showConfirmAlert(preguntaAprobacion)
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }

        if (Array.isArray(estadoAprobacion)) {
          this.aprobarAuditoriaSecuencial(estadoAprobacion, mensajeAprobacion);
        } else {
          this.aprobarAuditoria(estadoAprobacion, mensajeAprobacion);
        }
      });
  }

  async aprobarAuditoriaSecuencial(
    estadoAprobacion: number[],
    mensajeAprobacion: string
  ) {
    try {
      for (let i = 0; i < estadoAprobacion.length; i++) {
        const esUltimoEstado = i === estadoAprobacion.length - 1;
        await this.aprobarAuditoria(estadoAprobacion[i], mensajeAprobacion, esUltimoEstado);
      }
      // El Jefe aprueba y envía a revisión del auditado (último estado del array)
      // Se notifica al auditado con copia al auditor
      const ultimoEstado = estadoAprobacion[estadoAprobacion.length - 1];
      if (ultimoEstado === environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO) {
        this.notificarEnvioAuditado(this.auditoriaId);
      }
    } catch (error) {
      this.alertService.showErrorAlert("Error al aprobar el plan.");
    }
  }

  aprobarAuditoria(estadoAprobacion: number, mensajeAprobacion: string, mostrarMensaje: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
      const auditoriaEstado = this.construirObjetoAuditoriaEstado(estadoAprobacion);

      this.planAuditoriaService
        .post("auditoria-estado", auditoriaEstado)
        .subscribe({
          next: (res) => {
            if (mostrarMensaje) {
              this.alertService.showSuccessAlert(
                mensajeAprobacion,
                "Auditoría enviada"
              ).then(() => {
                this.router.navigate([`/planeacion/auditorias-internas/`]);
                resolve();
              });
            } else {
              resolve();
            }
          },
          error: (error) => {
            this.alertService.showErrorAlert("Error al aprobar el plan.");
            reject(error);
          }
        });
    });
  }

  construirObjetoAuditoriaEstado(estadoAprobacion: number) {
    return {
      auditoria_id: this.auditoriaId,
      usuario_id: this.usuarioId,
      usuario_rol: this.role,
      observacion: "",
      fase_id: environment.AUDITORIA_FASE.PLANEACION,
      estado_id: estadoAprobacion,
    };
  }

  abrirModalRechazo(): void {
    this.dialog.open(ModalRechazoAuditoriaComponent, {
      width: "50%",
      data: {
        usuarioId: this.usuarioId,
        role: this.role,
        auditoriaId: this.auditoriaId,
      },
    });
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }

  regresarRuta() {
    this.router.navigate([`/planeacion/auditorias-internas`]);
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

  mostrarAcciones(role: string, estadoAuditoriaId: number): boolean {
    const condicionesVisibilidad: { [key: string]: number[] } = {
      [environment.ROL.JEFE]: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE],
      auditado: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO],
      [environment.ROL.JEFE_DEPENDENCIA]: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO],
      [environment.ROL.ASISTENTE_DEPENDENCIA]: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO],
    };
    return condicionesVisibilidad[role]?.includes(estadoAuditoriaId) || false;
  }

  cargarDocumentos() {
    const tipoDocumentoMap = {
      [environment.TIPO_DOCUMENTO_PARAMETROS.PROGRAMA_TRABAJO]:
        "docProgramaTrabajo",
      [environment.TIPO_DOCUMENTO_PARAMETROS.SOLICITUD_INFORMACION]:
        "docSolicitudInformacion",
      [environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION]:
        "docCartaPresentacion",
      [environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO]:
        "docCompromisoEtico",
    };

    this.referenciaPdfService
      .consultarDocumentos(this.auditoriaId)
      .subscribe(async (res) => {
        const promesas = res.map(async (documento) => {
          const base64 = await this.nuxeoService.obtenerPorUUID(documento.nuxeo_enlace);

          const propiedad = tipoDocumentoMap[documento.tipo_id];
          if (propiedad) {
            (this as any)[propiedad] = base64;
          }

          this.documentos.push({ base64, tipo_id: documento.tipo_id });
        });

        await Promise.all(promesas);
      });
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

  /**
 * Notifica a los actores de cada dependencia asociada a la auditoría (correo_dependencia,
 * jefe_correo, asistente_correo y correo_complementario si existe) cuando el Jefe OCI
 * aprueba y envía el programa de auditoría a revisión del auditado.
 * Los auditores asignados reciben copia (Cc).
 *
 * Los correos se resuelven desde `dependencias_info`, que soporta múltiples dependencias
 * por auditoría. Los campos opcionales (jefe, asistente, complementario) solo se incluyen
 * si el MID los retorna.
 *
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
        const datosAuditoria = auditoria?.Data;
        const listaAuditores: any[] = auditores?.Data ?? [];
        const dependenciasInfo: any[] = datosAuditoria?.dependencias_info ?? [];

        const vigenciaId = datosAuditoria?.vigencia_id;
        const vigenciaObj = vigencias.find((v: any) => v.Id === vigenciaId);
        const vigenciaNombre = vigenciaObj?.Nombre || (vigenciaId ? String(vigenciaId) : "");

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
              .map((t) => t.UsuarioWSO2);

            const toAddressesDinamicos: string[] = dependenciasInfo.flatMap((dep) => {
              const correos: string[] = [];
              if (dep.correo_dependencia)    correos.push(dep.correo_dependencia);
              if (dep.jefe_correo)           correos.push(dep.jefe_correo);
              if (dep.asistente_correo)      correos.push(dep.asistente_correo);
              if (dep.correo_complementario) correos.push(dep.correo_complementario);
              return correos;
            });

            console.log(
              "[notificarEnvioAuditado] dependencias_info recibidas:",
              JSON.stringify(dependenciasInfo, null, 2)
            );
            console.log(
              "[notificarEnvioAuditado] ToAddresses resueltos:",
              toAddressesDinamicos
            );
            console.log(
              "[notificarEnvioAuditado] Cc auditores resueltos:",
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
            "[notificarEnvioAuditado] Payload final destinatarios:",
            JSON.stringify(destinatarios, null, 2)
            );

            const variablesSolicitud: VariablesSolicitud = {
              titulo_solicitud: "Revisión de Programa de Auditoría",
              tipo_solicitud: "revisión y firma",
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
                    "envio_revision_auditado_programa_trabajo"
                  );
                }
              })
            );
          })
        );
      }),

      catchError((error) => {
        console.warn("Error al notificar envío a auditado:", error);
        return throwError(() => error);
      })

    ).subscribe({
      error: (err) => console.warn("Error en notificación envío a auditado:", err),
    });
  }

  /**
   * Registra un log de notificación enviada en el CRUD de notificaciones (MongoDB).
   */
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