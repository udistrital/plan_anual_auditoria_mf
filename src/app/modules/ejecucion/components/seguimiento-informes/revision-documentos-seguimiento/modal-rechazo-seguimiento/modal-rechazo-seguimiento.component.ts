import { Component, Inject } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-modal-rechazo-seguimiento",
  templateUrl: "./modal-rechazo-seguimiento.component.html",
  styleUrl: "./modal-rechazo-seguimiento.component.css",
})
export class ModalRechazoSeguimientoComponent {
  formObservaciones!: FormGroup;

  titulo: string = "Observaciones";
  descripcion: string = "Motivos del rechazo";
  labelTextarea: string = "Motivos de rechazo";
  botonConfirmar: string = "Rechazar";
  mensajeConfirmacion: string = "¿Está seguro(a) de rechazar el informe final?";
  mensajeExito: string = "Informe final rechazado";
  descripcionExito: string = "La auditoría fue devuelta al auditor(a)";

  constructor(
    @Inject(MAT_DIALOG_DATA) public infoModal: any,
    public dialogRef: MatDialogRef<ModalRechazoSeguimientoComponent>,
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
        this.rechazarSeguimiento();
      });
  }

  rechazarSeguimiento() {
    const seguimientoEstado = this.construirObjetoSeguimientoEstado();
    this.planAuditoriaService
      .post("auditoria-estado", seguimientoEstado)
      .subscribe(
        () => {
          this.alertService.showSuccessAlert(
            this.descripcionExito,
            this.mensajeExito
          );
          this.dialogRef.close(this.formObservaciones.get("observaciones")?.value);
          this.router.navigate([`/ejecucion/seguimiento-informes/`]);
        },
        (error) => {
          this.alertService.showErrorAlert(
            "Error al asociar el nuevo estado al seguimiento."
          );
          console.error(error);
        }
      );
  }

  construirObjetoSeguimientoEstado() {
    return {
      auditoria_id: this.infoModal.auditoriaId,
      fase_id: environment.AUDITORIA_FASE.EJECUCION_FINAL,
      estado_id: this.infoModal.estadoRechazo,
      usuario_id: this.infoModal.usuarioId,
      usuario_rol: this.infoModal.role,
      observacion: this.formObservaciones.get("observaciones")?.value,
    };
  }
}
