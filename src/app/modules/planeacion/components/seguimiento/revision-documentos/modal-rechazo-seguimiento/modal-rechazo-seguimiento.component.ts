import { Component, Inject } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { ModalMotivosRechazoComponent } from "src/app/modules/programacion/components/consulta-plan-auditoria/revision-jefe/modal-motivos-rechazo/modal-motivos-rechazo.component";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";
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
    public dialogRef: MatDialogRef<ModalMotivosRechazoComponent>,
    private alertService: AlertService,
    private fb: FormBuilder,
    private planAuditoriaService: PlanAnualAuditoriaService,
    private router: Router
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

  construirObjetoAuditoriaEstado() {
    return {
      auditoria_id: this.infoModal.auditoriaId,
      usuario_id: this.infoModal.usuarioId,
      usuario_rol: this.infoModal.role,
      observacion: this.formObservaciones.get("observaciones")?.value,
      estado_interno_id: environment.AUDITORIA_ESTADO.PLANEACION.RECHAZADO_PROGRAMA_JEFE,
      fase_id: environment.AUDITORIA_FASE.PLANEACION,
    };
  }
}
