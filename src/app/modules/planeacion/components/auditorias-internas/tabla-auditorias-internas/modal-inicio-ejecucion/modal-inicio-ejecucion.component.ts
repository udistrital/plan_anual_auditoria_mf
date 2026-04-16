// modal-inicio-ejecucion.component.ts
import { Component, ElementRef, Inject, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { AlertService } from "src/app/shared/services/alert.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-modal-inicio-ejecucion",
  templateUrl: "./modal-inicio-ejecucion.component.html",
  styleUrl: "./modal-inicio-ejecucion.component.css",
})
export class ModalInicioEjecucionComponent {
  @ViewChild("fileInput", { static: false }) fileInput!: ElementRef;

  archivo: File | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public infoModal: any,
    public dialogRef: MatDialogRef<ModalInicioEjecucionComponent>,
    private alertService: AlertService,
    private planAuditoriaService: PlanAnualAuditoriaService,
    private nuxeoService: NuxeoService,
    private referenciaPdfService: ReferenciaPdfService,
  ) {}

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== "application/pdf") {
        this.alertService.showErrorAlert("Por favor, seleccione un archivo en formato PDF.");
        this.removerArchivo();
        input.value = "";
        return;
      }
      this.archivo = file;
    }
  }

  onArchivoInputClick(): void {
    this.fileInput.nativeElement.click();
  }

  removerArchivo(): void {
    this.archivo = null;
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = "";
    }
  }

  cargarArchivo(): void {
    if (!this.archivo) {
      this.alertService.showErrorAlert("Debe seleccionar un archivo");
      return;
    }

    const payload = [
      {
        IdTipoDocumento: environment.TIPO_DOCUMENTO.ACTA_INICIO_EJECUCION,
        nombre: this.archivo.name,
        descripcion: "Acta de aprobación de inicio de ejecución",
        metadatos: {},
        file: this.archivo,
      },
    ];

    this.nuxeoService.guardarArchivos(payload).subscribe({
      next: (response) => {
        this.guardarReferencia(response[0]);
      },
      error: () => {
        this.alertService.showErrorAlert("Error al cargar el archivo");
      },
    });
  }

  private guardarReferencia(nuxeoResponse: any): void {
    if (!nuxeoResponse?.res?.Enlace) return;

    this.referenciaPdfService
      .guardarReferencia(
        nuxeoResponse.res,
        "Auditoria",
        this.infoModal.auditoriaId,
        environment.TIPO_DOCUMENTO_PARAMETROS.ACTA_INICIO_EJECUCION
      )
      .subscribe({
        next: () => {
          this.alertService
            .showSuccessAlert("Archivo subido exitosamente.")
            .then(() => this.ejecutarCambioEstado());
        },
        error: () => {
          this.alertService.showErrorAlert("Error al guardar la referencia del documento.");
        },
      });
  }

  private ejecutarCambioEstado(): void {
    const esSeguimiento =
      this.infoModal.tipoEvaluacionId === environment.TIPO_EVALUACION.SEGUIMIENTO_ID;

    const payload = {
      auditoria_id: this.infoModal.auditoriaId,
      usuario_id: this.infoModal.usuarioId,
      usuario_rol: this.infoModal.usuarioRol,
      observacion: "",
      estado_id: environment.AUDITORIA_ESTADO.EJECUCION.POR_EJECUTAR,
      fase_id: esSeguimiento
        ? environment.AUDITORIA_FASE.EJECUCION_FINAL
        : environment.AUDITORIA_FASE.EJECUCION_PRELIMINAR,
    };

    this.planAuditoriaService.post("auditoria-estado", payload).subscribe({
      next: () => {
        this.alertService
          .showSuccessAlert("Ejecución iniciada correctamente.")
          .then(() => {
            this.dialogRef.close({ iniciado: true });
          });
      },
      error: () => {
        this.alertService.showErrorAlert("Error al iniciar la ejecución.");
      },
    });
  }
}