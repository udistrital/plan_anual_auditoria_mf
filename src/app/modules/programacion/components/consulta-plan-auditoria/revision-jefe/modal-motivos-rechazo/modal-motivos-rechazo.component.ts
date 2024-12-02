import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";

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
    private planAuditoriaService: PlanAnualAuditoriaService
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
        if (!confirmado.value) {
          return;
        }
        this.rechazarPlanAuditoria();
      });
  }

  rechazarPlanAuditoria() {
    const planEstado = {
      plan_auditoria_id: this.infoModal.planAuditoriaId,
      usuario_id: this.infoModal.usuarioId,
      observacion: this.formObservaciones.get("observaciones")?.value,
      estado_id: environment.PLAN_ESTADO.EN_BORRADOR_ID,
    };
  
    this.planAuditoriaService.post("estado", planEstado).subscribe(
      () => {
        this.alertService.showAlert(
          "Plan rechazado",
          "El plan fue devuelto al auditor(a)."
        );
        this.dialogRef.close();
      },
      (error) => {
        this.alertService.showErrorAlert(
          "Error al asociar el nuevo estado al plan."
        );
        console.error(error);
      }
    );
  }
}
