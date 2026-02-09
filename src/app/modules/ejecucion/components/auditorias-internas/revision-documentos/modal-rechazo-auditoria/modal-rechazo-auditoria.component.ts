import { Component, Inject } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { AlertService } from "src/app/shared/services/alert.service";

@Component({
  selector: "app-modal-rechazo-auditoria-ejecucion",
  templateUrl: "./modal-rechazo-auditoria.component.html",
  styleUrl: "./modal-rechazo-auditoria.component.css",
})
export class ModalRechazoAuditoriaEjecucionComponent {
  formObservaciones!: FormGroup;

  titulo: string = "Observaciones";
  descripcion: string = "Motivos del rechazo";
  labelTextarea: string = "Motivos de rechazo";
  botonConfirmar: string = "Rechazar";
  mensajeConfirmacion: string = "¿Está seguro(a) de rechazar el informe preliminar?";
  mensajeExito: string = "Informe preliminar rechazado";
  descripcionExito: string = "La auditoría fue devuelta al auditor(a)";

  constructor(
    @Inject(MAT_DIALOG_DATA) public infoModal: any,
    public dialogRef: MatDialogRef<ModalRechazoAuditoriaEjecucionComponent>,
    private alertService: AlertService,
    private fb: FormBuilder,
    private planAuditoriaService: PlanAnualAuditoriaService,
    private router: Router
  ) { }

  ngOnInit() {
    this.iniciarFormObservaciones();
    this.configurarTextos();
  }

  iniciarFormObservaciones() {
    this.formObservaciones = this.fb.group({
      observaciones: ["", Validators.required],
    });
  }

  configurarTextos() {
    if (this.infoModal.titulo) this.titulo = this.infoModal.titulo;
    if (this.infoModal.descripcion) this.descripcion = this.infoModal.descripcion;
    if (this.infoModal.labelTextarea) this.labelTextarea = this.infoModal.labelTextarea;
    if (this.infoModal.botonConfirmar) this.botonConfirmar = this.infoModal.botonConfirmar;
    if (this.infoModal.mensajeConfirmacion) this.mensajeConfirmacion = this.infoModal.mensajeConfirmacion;
    if (this.infoModal.mensajeExito) this.mensajeExito = this.infoModal.mensajeExito;
    if (this.infoModal.descripcionExito) this.descripcionExito = this.infoModal.descripcionExito;
  }

  preguntarConfirmacion() {
    if (this.formObservaciones.invalid) {
      this.alertService.showErrorAlert("Debe ingresar una observación.");
      return;
    }

    this.alertService
      .showConfirmAlert(this.mensajeConfirmacion)
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }
        this.rechazarAuditoria();
      });
  }

  rechazarAuditoria() {
    const auditoriaEstado = this.construirObjetoAuditoriaEstado();
    this.planAuditoriaService
      .post("auditoria-estado", auditoriaEstado)
      .subscribe(
        () => {
          this.alertService.showSuccessAlert(
            this.descripcionExito,
            this.mensajeExito
          );
          this.dialogRef.close(this.formObservaciones.get("observaciones")?.value);
          this.router.navigate([`/ejecucion/auditorias-internas/`]);
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
      estado_interno_id: this.infoModal.estadoRechazo,
      estado_id: 0,
    };
  }
}
