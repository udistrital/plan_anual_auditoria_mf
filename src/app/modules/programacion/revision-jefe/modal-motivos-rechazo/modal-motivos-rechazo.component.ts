import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatDialog } from "@angular/material/dialog";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AlertService } from "src/app/services/alert.service";
import { environment } from "src/environments/environment";
import { PlanAnualAuditoriaService } from "src/app/services/plan-anual-auditoria.service";
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
    public dialog: MatDialog,
    private alertService: AlertService,
    private fb: FormBuilder,
    private planAuditoriaService: PlanAnualAuditoriaService
  ) {}

  ngOnInit() {
    this.iniciarFormObservaciones();
    console.log(this.infoModal);
  }

  iniciarFormObservaciones() {
    this.formObservaciones = this.fb.group({
      observaciones: ["", Validators.required],
    });
  }

  preguntarConfirmacionRechazo() {
    this.alertService
      .showConfirmAlert("¿Está seguro de rechazar el plan de auditoría anual?")
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }
        this.rechazarPlanAuditoria();
      });
  }

  rechazarPlanAuditoria() {
    const planEstado = this.construirObjetoPlanEstado();
    this.planAuditoriaService.post("estado", planEstado).subscribe((res) => {
      this.alertService.showAlert(
        "Plan rechazado",
        "El Plan fue devuelto al auditor (a)"
      );
      this.dialogRef.close();
    });
  }

  construirObjetoPlanEstado() {
    return {
      //todo: este id esta quemado
      plan_auditoria_id: "6734d09dec8e871919b3b5dd",
      usuario_id: this.infoModal.usuarioId,
      observacion: this.formObservaciones.get("observaciones")?.value,
      estado_id: environment.PLAN_ESTADO.EN_BORRADOR_ID,
    };
  }
}
