import { Component, Inject, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { ModalMotivosRechazoComponent } from "src/app/modules/programacion/components/consulta-plan-auditoria/revision-jefe/modal-motivos-rechazo/modal-motivos-rechazo.component";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";
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
  selector: "app-modal-rechazo-auditoria",
  templateUrl: "./modal-rechazo-auditoria.component.html",
  styleUrl: "./modal-rechazo-auditoria.component.css",
})
export class ModalRechazoAuditoriaComponent implements OnInit {
  formObservaciones!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public infoModal: any,
    public dialogRef: MatDialogRef<ModalMotivosRechazoComponent>,
    private alertService: AlertService,
    private fb: FormBuilder,
    private planAuditoriaService: PlanAnualAuditoriaService,
    private router: Router,
    private readonly tercerosService: TercerosService,
    private readonly notificacionesService: NotificacionesService,
    private readonly notificacionRegistroCrudService: NotificacionRegistroCrudService,
    private readonly parametrosUtilsService: ParametrosUtilsService,
  ) {}

  ngOnInit() {
    this.iniciarFormObservaciones();
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
      .showConfirmAlert("¿Está seguro de rechazar la Auditoría?")
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
            "Auditoría rechazada",
            "La auditoría fue devuelta al auditor(a)."
          ).then(() => {
            this.notificarRechazo(this.infoModal.auditoriaId);
            this.dialogRef.close();
            this.router.navigate([`/planeacion/auditorias-internas/`]);
          });
        },
        error: (error) => {
          this.alertService.showErrorAlert(
            "Error al asociar el nuevo estado a la auditoría."
          );
          console.error(error);
        }
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

  /**
   * Notifica a los auditores asignados cuando el Jefe OCI o el auditado
   * rechaza el programa de auditoría.
   */
  /**
   * Notifica a los auditores asignados cuando el Jefe OCI o el auditado rechaza
   * el programa de auditoría.
   * Sigue el patrón de consulta-plan-auditoria: resuelve Terceros primero y sola,
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
        console.log("Tercero autenticado:", tercero.NombreCompleto);
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

        // Resolver vigencia igual que el PAA — desde ParametrosUtilsService
        const vigenciaId = datosAuditoria?.vigencia_id;
        const vigenciaObj = vigencias.find((v: any) => v.Id === vigenciaId);
        const vigenciaNombre = vigenciaObj?.Nombre || (vigenciaId ? String(vigenciaId) : "");

        console.log("auditoria_id:", auditoriaId);
        console.log("titulo auditoria:", datosAuditoria?.titulo);
        console.log("vigencia_id:", vigenciaId);
        console.log("vigencia_nombre resuelta:", vigenciaNombre);
        console.log("auditores encontrados:", listaAuditores.length);
        console.log("auditores:", listaAuditores.map((a: any) => a.auditor_id));

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

            console.log("correos auditores resueltos:", correosAuditores);

            if (correosAuditores.length === 0) {
              console.warn("No se encontraron correos de auditores — se notifica solo al environment.");
            }

            const fijosRechazo = role === environment.ROL.JEFE
              ? environment.NOTIFICACION_PROGRAMA_TRABAJO_RECHAZO_JEFE_DESTINATARIOS
              : environment.NOTIFICACION_PROGRAMA_TRABAJO_RECHAZO_AUDITADO_DESTINATARIOS;

            console.log("constante de environment seleccionada:", role === environment.ROL.JEFE
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

            const variablesSolicitud: VariablesSolicitud = {
              titulo_solicitud: "Rechazo de Programa de Auditoría",
              tipo_solicitud: "revisión y corrección",
              nombre_documento: `Programa de Auditoría${datosAuditoria?.titulo ? ` - ${datosAuditoria.titulo}` : ''}`,
              vigencia: vigenciaNombre,
              rol_remitente: rolRemitente,
              nombre_remitente: nombreRemitente || rolRemitente,
              fecha_envio: new Date().toLocaleDateString(),
            };

            console.log("PAYLOAD RECHAZO:", JSON.stringify({ destinatarios, variablesSolicitud }, null, 2));
            console.log("Correos a los que se va a enviar:");
            console.log("  To:", destinatarios.ToAddresses);
            console.log("  Cc:", destinatarios.CcAddresses);
            console.log("  Bcc:", destinatarios.BccAddresses);

            return this.notificacionesService.enviarNotificacionSolicitud(
              destinatarios,
              variablesSolicitud
            ).pipe(
              tap((response: any) => {
                console.log("RESPUESTA NOTIFICACION:", JSON.stringify(response, null, 2));
                if (response?.Status == 200) {
                  console.log("Registrando en BD:", JSON.stringify({
                    template: "SISIFO_PLANTILLA_SOLICITUD",
                    tipo_notificacion: "rechazo_programa_trabajo",
                    referencia_id: auditoriaId,
                    destinatarios_to: destinatarios.ToAddresses,
                    destinatarios_cc: destinatarios.CcAddresses,
                    destinatarios_bcc: destinatarios.BccAddresses,
                  }, null, 2));
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
        console.warn("Error al notificar rechazo del programa:", error);
        console.warn("Status:", error.status);
        console.warn("Body:", JSON.stringify(error.error));
        return throwError(() => error);
      })

    ).subscribe({
      error: (err) => console.warn("Error en notificación rechazo:", err),
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
      template: template,
      fecha_envio: new Date(),
      metadatos: {
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