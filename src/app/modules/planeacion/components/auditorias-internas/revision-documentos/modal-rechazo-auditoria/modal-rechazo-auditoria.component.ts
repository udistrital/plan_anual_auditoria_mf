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
    const auditoriaEstado = this.construirObjetoAuditoriaEstado();
    this.planAuditoriaService
      .post("auditoria-estado", auditoriaEstado)
      .subscribe(
        () => {
          this.alertService.showAlert(
            "Auditoría rechazada",
            "La auditoría fue devuelta al auditor(a)."
          );
          this.dialogRef.close();
          this.router.navigate([`/planeacion/auditorias-internas/`]);
        },
        (error) => {
          this.alertService.showErrorAlert(
            "Error al asociar el nuevo estado a la auditoría."
          );
          console.error(error);
        }
      );
  }

  construirObjetoAuditoriaEstado() {
    return {
      auditoria_id: this.infoModal.auditoriaId,
      usuario_id: this.infoModal.usuarioId,
      usuario_rol: this.infoModal.role,
      observacion: this.formObservaciones.get("observaciones")?.value,
      estado_id: environment.AUDITORIA_ESTADO.RECHAZADO_ID,
    };
  }
}
