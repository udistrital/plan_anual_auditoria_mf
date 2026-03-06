import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { Router } from "@angular/router";
import { switchMap, catchError } from "rxjs/operators";
import { throwError, of, forkJoin } from "rxjs";
import { TercerosService } from "src/app/shared/services/terceros.service";
import { DestinatariosEmail, NotificacionesService, VariablesRechazo } from "src/app/shared/services/notificaciones.service";
import { NotificacionRegistroCrudService } from "src/app/core/services/notificacion-registro-crud.service";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { PLANTILLA_RECHAZO_NOMBRE } from "src/app/core/services/notificaciones-mid.service";

@Component({
  selector: "app-modal-motivos-rechazo",
  templateUrl: "./modal-motivos-rechazo.component.html",
  styleUrls: ["./modal-motivos-rechazo.component.css"],
})
export class ModalMotivosRechazoComponent implements OnInit {
  formObservaciones!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public infoModal: any,
    public dialogRef: MatDialogRef<ModalMotivosRechazoComponent>,
    private alertService: AlertService,
    private fb: FormBuilder,
    private planAuditoriaService: PlanAnualAuditoriaService,
    private router: Router,
    private tercerosService: TercerosService,
    private notificacionesService: NotificacionesService,
    private notificacionRegistroCrudService: NotificacionRegistroCrudService,
    private parametrosUtilsService: ParametrosUtilsService,
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
      .showConfirmAlert("¿Está seguro de rechazar el Plan Anual de Auditoría?")
      .then((confirmado) => {
        if (!confirmado.value) return;
        this.rechazarPlanAuditoria();
      });
  }

  rechazarPlanAuditoria() {
    const planEstado = {
      plan_auditoria_id: this.infoModal.planAuditoriaId,
      usuario_id: this.infoModal.usuarioId,
      observacion: this.formObservaciones.get("observaciones")?.value,
      estado_id: environment.PLAN_ESTADO.RECHAZADO,
    };
  
    this.planAuditoriaService.post("estado", planEstado).subscribe(
      () => {
        this.alertService.showAlert(
          "Plan rechazado",
          "El plan fue devuelto al auditor(a)."
        );
        this.dialogRef.close();
        this.router.navigate([`/programacion/plan-auditoria/`]);
        this.notificarRechazo();
      },
      (error) => {
        this.alertService.showErrorAlert(
          "Error al asociar el nuevo estado al plan."
        );
        console.error(error);
      }
    );
  }

  private notificarRechazo(): void {
    const motivoRechazo = this.formObservaciones.get("observaciones")?.value;
    // rolRemitente viene del componente padre — diferencia si rechazó Jefe o Secretario
    const rolRemitente = this.infoModal.rolRemitente;

    this.planAuditoriaService.get(`plan-auditoria/${this.infoModal.planAuditoriaId}`).pipe(
      switchMap((planResponse: any) => {
        const creadoPorId = planResponse?.Data?.creado_por_id;
        const vigenciaId  = planResponse?.Data?.vigencia_id;

        console.log("creado_por_id:", creadoPorId);
        console.log("vigencia_id:", vigenciaId);

        // Observable para obtener el tercero (correo auditor)
        // Si no hay creado_por_id se retorna objeto vacío para manejar el caso sin correo
        const tercero$ = creadoPorId
          ? this.tercerosService.getTerceroById(creadoPorId)
          : of({ UsuarioWSO2: null });

        // Observable para obtener las vigencias desde Parametross
        const vigencias$ = vigenciaId
          ? this.parametrosUtilsService.getVigencias()
          : of([]);

        return forkJoin({
          tercero: tercero$,
          vigencias: vigencias$,
          vigenciaId: of(vigenciaId),
        });
      }),

      switchMap(({ tercero, vigencias, vigenciaId }: any) => {

        const vigenciaObj = vigencias.find((v: any) => v.Id === vigenciaId);
        const vigenciaNombre = vigenciaObj?.Nombre || (vigenciaId ? String(vigenciaId) : "");

        console.log("vigenciaNombre resuelta:", vigenciaNombre);

        const correoAuditor = tercero?.UsuarioWSO2 || null;
        console.log("UsuarioWSO2:", correoAuditor);

        if (!correoAuditor) {
          console.warn("No se encontró UsuarioWSO2 para el auditor, se notifica solo al environment de rechazo");
        }

        const destinatarios = this.tercerosService.combinarDestinatarios(
          correoAuditor ? [correoAuditor] : [],
          environment["NOTIFICACION_PLAN_AUDITORIA_RECHAZO_DESTINATARIOS"]
        );

        const variablesRechazo: VariablesRechazo = {
          // Título diferenciado según el rol que rechaza
          titulo_rechazo: `Rechazo de Plan Anual de Auditoría - ${rolRemitente}`,
          nombre_documento: "Plan Anual de Auditoría",
          vigencia: vigenciaNombre,
          motivo_rechazo: motivoRechazo,
          rol_remitente: rolRemitente,
          nombre_remitente: this.infoModal.nombreRemitente || rolRemitente,
          fecha_envio: new Date().toLocaleDateString(),
        };

        console.log("PAYLOAD RECHAZO:", JSON.stringify({ destinatarios, variablesRechazo }, null, 2));

        return this.notificacionesService.enviarNotificacionRechazo(
          destinatarios,
          variablesRechazo
        ).pipe(
          switchMap((response: any) => of({ response, vigenciaNombre, destinatarios }))
        );
      }),

      catchError((error) => {
        console.warn("Error al enviar notificación de rechazo:", error);
        console.warn("Status:", error.status);
        console.warn("Body:", JSON.stringify(error.error));
        return throwError(() => error);
      })

    ).subscribe({
      next: ({ response, vigenciaNombre, destinatarios }: any) => {
        console.log("RESPUESTA NOTIFICACION:", JSON.stringify(response, null, 2));
        // Solo se registra en MongoDB si el correo fue enviado exitosamente
        if (response?.Status == 200) {
          this.registrarNotificacionRechazo(motivoRechazo, rolRemitente, vigenciaNombre, destinatarios);
        }
      },
      error: (err) => console.warn("Error en notificación de rechazo:", err),
    });
  }

  private registrarNotificacionRechazo(
    motivoRechazo: string,
    rolRemitente: string,
    vigenciaNombre: string,
    destinatarios: DestinatariosEmail  
  ): void {
    const payload = {
      template: PLANTILLA_RECHAZO_NOMBRE,
      fecha_envio: new Date(),
      metadatos: {
        tipo_notificacion: 'rechazo_paa',
        motivo_rechazo: motivoRechazo,
        rol_remitente: rolRemitente,
        vigencia: vigenciaNombre,
        destinatarios_to: destinatarios.ToAddresses ?? [],
        destinatarios_cc: destinatarios.CcAddresses ?? [],
        destinatarios_bcc: destinatarios.BccAddresses ?? [],
      },
      referencia_id: this.infoModal.planAuditoriaId,
      referencia_tipo: 'PAA',
    };

    this.notificacionRegistroCrudService.post(payload).subscribe({
      next: (res) => console.debug("Registro de notificación de rechazo guardado:", res),
      error: (err) => console.warn("Error guardando registro de notificación de rechazo:", err),
    });
  }
}