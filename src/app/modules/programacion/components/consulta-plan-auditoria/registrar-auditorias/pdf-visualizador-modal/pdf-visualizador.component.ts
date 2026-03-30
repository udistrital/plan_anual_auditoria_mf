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
import { DescargaService } from "src/app/shared/services/descarga.service";
import { AlertService } from "src/app/shared/services/alert.service";

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
    public data: { base64Document: string; id: string, vigenciaNombre: string, actualizado: boolean },
    private alertService: AlertService,
    private descargaService: DescargaService,
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
      this.alertService.showErrorAlert("Error al descargarel el PAA");
    }
  }
}