import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Inject,
} from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

import { environment } from "src/environments/environment";

//servicios
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { DescargaService } from "src/app/shared/services/descarga.service";

@Component({
  selector: "app-modal-pdf-visualizador",
  templateUrl: "./pdf-visualizador.component.html",
  styleUrls: ["./pdf-visualizador.component.css"],
})
export class ModalPdfVisualizadorComponent implements OnInit {
  @ViewChild("pdfCanvas", { static: true })
  pdfCanvas!: ElementRef<HTMLCanvasElement>;
  private base64 = "";
  pdfLoaded = false;
  pdfSrc: Uint8Array | undefined;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { base64Document: string; id: string, vigenciaNombre: string },
    private nuxeoService: NuxeoService,
    private alertService: AlertService,
    private referenciaPdfService: ReferenciaPdfService,
    private descargaService: DescargaService,
    private alertaService: AlertService,
  ) { }

  ngOnInit() {
    const documentSource = this.data.base64Document;
    if (documentSource) {
      this.cargarPdfDeBase64(documentSource);
    } else {
      console.error("No se proporcionó un documento PDF");
    }
  }

  cargarPdfDeBase64(base64: string) {
    this.base64 = base64;
    try {
      console.log("render", this.base64);
      const arrayBuffer = this.base64ToArrayBuffer(this.base64);
      this.pdfSrc = new Uint8Array(arrayBuffer);
      this.pdfLoaded = true;
    } catch (error) {
      console.error("Error loading PDF:", error);
    }
  }

  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  guardarPdf() {
    if (this.base64 !== "") {
      const payload = {
        IdTipoDocumento: environment.TIPO_DOCUMENTO.PLANES_AUDITORIA,
        nombre: this.data.id,
        descripcion: "Documento pdf, auditorias de plan de auditoria",
        metadatos: {},
        file: this.base64,
      };

      this.nuxeoService.guardarArchivos([payload]).subscribe({
        next: (response: any) => {
          const documento = response[0];
          console.log("Documento subido exitosamente", documento);
          this.guardarReferencia(
            documento,
            "Plan Auditoria",
            this.data.id,
            6810
          );
        },
        error: (error) => {
          console.error("Error al subir el documento", error);
        },
      });
    }
  }

  guardarReferencia(
    nuxeoResponse: any,
    referencia_tipo: string,
    referencia_id: string,
    tipo_id: number
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
            this.alertService.showSuccessAlert("Archivo subido exitosamente.");
          },
          error: (error) => {
            console.error("Error al guardar la referencia", error);
          },
        });
    }
  }

  async descargarPDF(): Promise<void> {
    try {
      const base64File = this.data.base64Document;
      await this.descargaService.descargarArchivo(
        base64File,
        'application/pdf',
        'Plan Anual de Auditoria ' + this.data.vigenciaNombre
      );
    } catch (error) {
      console.error("Error al descargar el PAA:", error);
      this.alertaService.showErrorAlert("Error al descargarel el PAA");
    }
  }
}
