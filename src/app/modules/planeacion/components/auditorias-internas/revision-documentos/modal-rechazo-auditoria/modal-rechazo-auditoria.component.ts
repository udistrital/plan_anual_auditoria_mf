import { Component, Inject } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { ModalMotivosRechazoComponent } from "src/app/modules/programacion/components/consulta-plan-auditoria/revision-jefe/modal-motivos-rechazo/modal-motivos-rechazo.component";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-modal-rechazo-auditoria",
  templateUrl: "./modal-rechazo-auditoria.component.html",
  styleUrl: "./modal-rechazo-auditoria.component.css",
})
export class ModalRechazoAuditoriaComponent {
  formObservaciones!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public infoModal: any,
    public dialogRef: MatDialogRef<ModalMotivosRechazoComponent>,
    private alertService: AlertService,
    private fb: FormBuilder,
    private planAuditoriaService: PlanAnualAuditoriaService,
    private router: Router
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
    // const planEstado = {
    //   plan_auditoria_id: this.infoModal.planAuditoriaId,
    //   usuario_id: this.infoModal.usuarioId,
    //   observacion: this.formObservaciones.get("observaciones")?.value,
    //   estado_id: environment.PLAN_ESTADO.EN_RECHAZO_ID,
    // };
    // this.planAuditoriaService.post("estado", planEstado).subscribe(
    //   () => {
    //     this.alertService.showAlert(
    //       "Plan rechazado",
    //       "El plan fue devuelto al auditor(a)."
    //     );
    //     this.dialogRef.close();
    //     this.router.navigate([
    //       `/programacion/plan-auditoria/`
    //     ]);
    //   },
    //   (error) => {
    //     this.alertService.showErrorAlert(
    //       "Error al asociar el nuevo estado al plan."
    //     );
    //     console.error(error);
    //   }
    // );
  }
}
