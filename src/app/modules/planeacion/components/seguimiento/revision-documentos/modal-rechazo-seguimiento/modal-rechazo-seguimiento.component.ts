import { Component, Inject } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { ModalMotivosRechazoComponent } from "src/app/modules/programacion/components/consulta-plan-auditoria/revision-jefe/modal-motivos-rechazo/modal-motivos-rechazo.component";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";
import { TercerosService } from "src/app/shared/services/terceros.service";
import { NotificacionesService, DestinatariosEmail, VariablesSolicitud } from "src/app/shared/services/notificaciones.service";
import { NotificacionRegistroCrudService } from "src/app/core/services/notificacion-registro-crud.service";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { PLANTILLA_SOLICITUD_NOMBRE } from "src/app/core/services/notificaciones-mid.service";
import { forkJoin, of, throwError } from "rxjs";
import { catchError, exhaustMap, switchMap, tap } from "rxjs/operators";
import {
  mensajesRechazoPorTipoEvaluacionId,
  TiposMensajeRechazo,
  tiposMensajeRechazo,
} from "./modal-rechazo-seguimiento.utilidades";


export interface RechazoData {
  auditoriaId: string;
  usuarioId: any;
  role: string | null;
  tipoEvaluacionId: number;
}

@Component({
  selector: "app-modal-rechazo-seguimiento",
  templateUrl: "./modal-rechazo-seguimiento.component.html",
  styleUrl: "./modal-rechazo-seguimiento.component.css",
})
export class ModalRechazoSeguimientoComponent {
  formObservaciones!: FormGroup;
  mensajes!: { [key: string]: string };
  tiposMensaje!: TiposMensajeRechazo;

  constructor(
    @Inject(MAT_DIALOG_DATA) public infoModal: RechazoData,
    public readonly dialogRef: MatDialogRef<ModalMotivosRechazoComponent>,
    private readonly alertService: AlertService,
    private readonly fb: FormBuilder,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly router: Router,
    private readonly tercerosService: TercerosService,
    private readonly notificacionesService: NotificacionesService,
    private readonly notificacionRegistroCrudService: NotificacionRegistroCrudService,
    private readonly parametrosUtilsService: ParametrosUtilsService,
  ) {}

  ngOnInit() {
    this.iniciarFormObservaciones();
    this.mensajes =
        mensajesRechazoPorTipoEvaluacionId[this.infoModal.tipoEvaluacionId];
    this.tiposMensaje = tiposMensajeRechazo;
  }

  iniciarFormObservaciones() {
    this.formObservaciones = this.fb.group({
      observaciones: ["", Validators.required],
    });
  }

  preguntarConfirmacionRechazo() {
    if (this.formObservaciones.invalid) {
      this.alertService.showErrorAlert("Debe ingresar una observación.");
      return;
    }

    this.alertService
      .showConfirmAlert(this.mensajes[this.tiposMensaje.confirmacion])
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }
        this.rechazarPlanAuditoria();
      });
  }

  rechazarPlanAuditoria() {
    const auditoriaEstado = this.construirObjetoAuditoriaEstado();
    this.planAuditoriaService
      .post("auditoria-estado", auditoriaEstado)
      .subscribe({
        next: () => {
          this.alertService.showSuccessAlert(
            this.mensajes[this.tiposMensaje.titulo],
            this.mensajes[this.tiposMensaje.mensaje],
          ).then(() => {
            this.notificarRechazo(this.infoModal.auditoriaId);
            this.dialogRef.close();
            this.router.navigate([`/planeacion/seguimiento/`]);
          });
        },
        error: (error) => {
          this.alertService.showErrorAlert(
            this.mensajes[this.tiposMensaje.error]
          );
          console.error(error);
        }
  });
  }

  /**
   * Notifica a los auditores asignados cuando el Jefe OCI o el auditado (Jefe/Asistente
   * de Dependencia) rechaza el programa de auditoría de seguimiento.
   * Sigue el patrón de consulta-plan-auditoria: resuelve Terceros primero y solo,
   * luego encadena las demás consultas.
   */
  private notificarRechazo(auditoriaId: string): void {
    const role = this.infoModal.role;
    const rolRemitente = role === environment.ROL.JEFE
      ? "Jefe OCI"
      : role === environment.ROL.JEFE_DEPENDENCIA
        ? "Jefe de Dependencia"
        : role === environment.ROL.ASISTENTE_DEPENDENCIA
          ? "Asistente de Dependencia"
          : role || "Revisor";

    this.tercerosService.getAuthenticatedUserTerceroIdentification().pipe(

      exhaustMap((tercero) => {
        console.log("[notificarRechazo - SEGUIMIENTO] Tercero autenticado:", tercero.NombreCompleto);
        return forkJoin({
          auditoria: this.planAuditoriaService.get(`auditoria/${auditoriaId}`),
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

        const vigenciaId = datosAuditoria?.vigencia_id;
        const vigenciaObj = vigencias.find((v: any) => v.Id === vigenciaId);
        const vigenciaNombre = vigenciaObj?.Nombre || (vigenciaId ? String(vigenciaId) : "");

        console.log("[notificarRechazo - SEGUIMIENTO] auditoriaId:", auditoriaId);
        console.log("[notificarRechazo - SEGUIMIENTO] titulo auditoria:", datosAuditoria?.titulo);
        console.log("[notificarRechazo - SEGUIMIENTO] vigencia_id:", vigenciaId);
        console.log("[notificarRechazo - SEGUIMIENTO] vigencia_nombre resuelta:", vigenciaNombre);
        console.log("[notificarRechazo - SEGUIMIENTO] auditores encontrados:", listaAuditores.length);

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

            console.log("[notificarRechazo - SEGUIMIENTO] correos auditores resueltos:", correosAuditores);

            if (correosAuditores.length === 0) {
              console.warn("[notificarRechazo - SEGUIMIENTO] No se encontraron correos de auditores");
            }

            const fijosRechazo = role === environment.ROL.JEFE
              ? environment.NOTIFICACION_PROGRAMA_TRABAJO_RECHAZO_JEFE_DESTINATARIOS
              : environment.NOTIFICACION_PROGRAMA_TRABAJO_RECHAZO_AUDITADO_DESTINATARIOS;

            console.log("[notificarRechazo - SEGUIMIENTO] constante environment seleccionada:", role === environment.ROL.JEFE
              ? "RECHAZO_JEFE_DESTINATARIOS"
              : "RECHAZO_AUDITADO_DESTINATARIOS"
            );

            const destinatarios: DestinatariosEmail = {
              ToAddresses: [
                ...correosAuditores,
                ...(fijosRechazo.ToAddresses ?? []),
              ],
              CcAddresses: fijosRechazo.CcAddresses ?? [],
              BccAddresses: fijosRechazo.BccAddresses ?? [],
            };

            console.log("[notificarRechazo - SEGUIMIENTO] Payload final destinatarios:", JSON.stringify(destinatarios, null, 2));

            const variablesSolicitud: VariablesSolicitud = {
              titulo_solicitud: "Rechazo de Programa de Auditoría",
              tipo_solicitud: "revisión y corrección",
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
                console.log("[notificarRechazo - SEGUIMIENTO] RESPUESTA NOTIFICACION:", JSON.stringify(response, null, 2));
                if (response?.Status == 200) {
                  console.log("[notificarRechazo - SEGUIMIENTO] Notificación enviada exitosamente");
                  this.registrarNotificacion(
                    auditoriaId,
                    destinatarios,
                    variablesSolicitud,
                    "rechazo_programa_trabajo"
                  );
                }
              })
            );
          })
        );
      }),

      catchError((error) => {
        console.warn("[notificarRechazo - SEGUIMIENTO] Error al notificar rechazo:", error);
        console.warn("[notificarRechazo - SEGUIMIENTO] Status:", error?.status);
        console.warn("[notificarRechazo - SEGUIMIENTO] Body:", JSON.stringify(error?.error));
        return throwError(() => error);
      })

    ).subscribe({
      error: (err) => console.warn("[notificarRechazo - SEGUIMIENTO] Error suscripción:", err),
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
      referencia_tipo: 'AUDITORIA SEGUIMIENTO',
    };

    console.log("[registrarNotificacion - SEGUIMIENTO] Payload a registrar:", JSON.stringify(payload, null, 2));

    this.notificacionRegistroCrudService.post(payload).subscribe({
      next: (res) => console.debug("[registrarNotificacion - SEGUIMIENTO] Registro guardado:", res),
      error: (err) => console.warn("[registrarNotificacion - SEGUIMIENTO] Error guardando:", err),
    });
  }

  construirObjetoAuditoriaEstado() {
    return {
      auditoria_id: this.infoModal.auditoriaId,
      usuario_id: this.infoModal.usuarioId,
      usuario_rol: this.infoModal.role,
      observacion: this.formObservaciones.get("observaciones")?.value,
      estado_id: environment.AUDITORIA_ESTADO.PLANEACION.RECHAZADO_PROGRAMA_JEFE,
      fase_id: environment.AUDITORIA_FASE.PLANEACION,
    };
  }
}
