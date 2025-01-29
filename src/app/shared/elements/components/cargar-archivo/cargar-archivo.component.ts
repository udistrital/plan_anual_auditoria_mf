import { PlanAnualAuditoriaMid } from "./../../../../core/services/plan-anual-auditoria-mid.service";
import { Component, ElementRef, Inject, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { ModalService } from "src/app/shared/services/modal.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";

@Component({
  selector: "app-cargar-archivo",
  templateUrl: "./cargar-archivo.component.html",
  styleUrl: "./cargar-archivo.component.css",
})
export class CargarArchivoComponent {
  archivo: File | null = null; // Único archivo seleccionado
  @ViewChild("fileInput", { static: false }) fileInput!: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<CargarArchivoComponent>,
    private PlanAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private nuxeoService: NuxeoService,
    private alertService: AlertService,
    private modalService: ModalService,
    private referenciaPdfService: ReferenciaPdfService,

    @Inject(MAT_DIALOG_DATA)
    public data: {
      tipoArchivo: string;
      idTipoDocumento: number;
      descripcion: string;
      id: string;
      vigenciaId: number;
      cargaLambda: boolean;
      tipo: string;
      tipoIdReferencia: number;
    }
  ) {}

  onArchivoSelecionado(event: any): void {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;

    if (file) {
      if (
        (this.data.tipoArchivo === "pdf" && file.type !== "application/pdf") ||
        (this.data.tipoArchivo === "xlsx" &&
          file.type !==
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      ) {
        alert(
          "Por favor seleccione un archivo válido según el tipo especificado."
        );
        this.removerArchivo();
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
    this.fileInput.nativeElement.value = "";
  }

  cargarArchivo(): void {
    if (!this.archivo) {
      this.alertService.showErrorAlert("No se ha seleccionado ningún archivo.");
      return;
    }

    if (this.data.cargaLambda) {
      this.cargarConLambda().then((success) => {
        if (success) {
          this.cargarConNuxeo().then((nuxeoResponse) => {
            this.guardarReferencia(
              nuxeoResponse,
              "Plan Auditoria",
              this.data.id,
              0,
              false
            );
          });
        }
      });
    } else {
      this.cargarConNuxeo().then((nuxeoResponse) => {
        this.guardarReferencia(
          nuxeoResponse,
          "Plan Auditoria",
          this.data.id,
          this.data.tipoIdReferencia,
          true
        );
      });
    }
  }

  private async cargarConLambda(): Promise<boolean> {
    try {
      const base64 = await this.nuxeoService.fileABase64(this.archivo!);
      console.log("vigencia Masivo", this.data.vigenciaId);

      let payload: any = {};
      switch (this.data.tipo) {
        case "auditorias":
          payload = {
            base64data: base64,
            complement: {
              plan_auditoria_id: this.data.id,
              vigencia_id: this.data.vigenciaId,
            },
            type_upload: "auditorias",
          };
          break;
        case "actividades":
          payload = {
            base64data: base64,
            complement: { auditoria_id: this.data.id },
            type_upload: "actividades",
          };
          break;
      }

      const response: any = await this.PlanAnualAuditoriaMid.post(
        `cargue-masivo/${this.data.tipo}`,
        payload
      ).toPromise();

      if (response && response.Data) {
        console.log("Archivo enviado exitosamente al MID", response);
        this.resultados(response.Data);
        return true;
      } else {
        this.alertService.showErrorAlert(
          "La respuesta de cargue masivo no contiene datos válidos."
        );
        return false;
      }
    } catch (error) {
      this.alertService.showErrorAlert(
        "Error al enviar el archivo a cargue masivo. Por favor, revise el log."
      );
      console.error("Error al enviar el archivo al MID", error);
      return false;
    }
  }

  private async cargarConNuxeo(): Promise<any> {
    const archivoConDatos = {
      IdTipoDocumento: this.data.idTipoDocumento,
      nombre: this.archivo!.name,
      descripcion: this.data.descripcion,
      file: this.archivo!,
    };

    return new Promise((resolve, reject) => {
      this.nuxeoService.guardarArchivos([archivoConDatos]).subscribe({
        next: (response) => {
          console.log("Archivo subido a Nuxeo", response);
          this.dialogRef.close();
          resolve(response[0]);
        },
        error: (error) => {
          this.alertService.showErrorAlert("Error al subir el archivo.");
          console.error("Error al subir el archivo", error);
          reject(error);
        },
      });
    });
  }

  guardarReferencia(
    nuxeoResponse: any,
    referencia_tipo: string,
    referencia_id: string,
    tipo_id: number,
    mostrarMensaje: boolean
  ): void {
    if (nuxeoResponse.res.Enlace) {
      this.referenciaPdfService
        .guardarReferencia(
          nuxeoResponse.res,
          referencia_tipo,
          referencia_id,
          tipo_id
        )
        .subscribe({
          next: (response) => {
            console.log("Referencia guardada exitosamente", response);
            if (mostrarMensaje) {
              this.alertService.showSuccessAlert(
                "Archivo subido exitosamente."
              );
            }
          },
          error: (error) => {
            console.error("Error al guardar la referencia", error);
          },
        });
    }
  }

  resultados(data: any): void {
    let mensaje = "";

    if (data.Erróneos?.length > 0) {
      mensaje += `<strong>Se encontraron los siguientes errores en algunos registros:</strong><ul><br>`;
      data.Erróneos.forEach((error: any) => {
        mensaje += `<li><strong>Fila ${error.Idx}:</strong> ${error.Error}</li>`;
      });
      mensaje += `</ul>`;
    }

    if (data.Correctos?.length > 0) {
      mensaje += `<br><strong>Registros correctos:</strong><ul>`;
      mensaje += data.Correctos.join(", ") + "<br><br>";
    }

    this.modalService.mostrarModal(mensaje, "warning", "");
  }
}
