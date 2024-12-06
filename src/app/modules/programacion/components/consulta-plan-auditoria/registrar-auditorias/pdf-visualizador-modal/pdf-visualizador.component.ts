import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Inject,
} from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { GestorDocumentalService } from "src/app/core/services/gestor-documental.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";

import { HttpResponse } from '@angular/common/http';
import { filter, map } from 'rxjs/operators';

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
    public data: { base64Document: string; id: string },
    private gestorDocumentalService: GestorDocumentalService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
  ) { }

  ngOnInit() {
    const documentSource = this.data.base64Document;
    if (documentSource) {
      this.loadPdfFromBase64(documentSource);
    } else {
      console.error("No se proporcionó un documento PDF");
    }
  }

  loadPdfFromBase64(base64: string) {
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
    const binaryString = window.atob(base64); // Decodifica Base64
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer; // Retorna el ArrayBuffer
  }
  private registroPlanAuditoria: any;
  guardarPdf() {
    if (this.base64 !== "") {
      const payload = [
        {
          IdTipoDocumento: 1,
          nombre: this.data.id,
          descripcion: "Documento pdf, auditorias de plan de auditoria",
          metadatos: {},
          file: this.base64,
        },
      ];
      this.gestorDocumentalService
        .postAny("/document/uploadAnyFormat", payload)
        .subscribe({
          next: (response) => {
            console.log("Documento subido exitosamente", response);
            this.registroPlanAuditoria = response;
            console.log("---------------registroPlanAuditoria ",this.registroPlanAuditoria.res.Nombre)
            this.guardarReferenciaPdf(this.registroPlanAuditoria.res.Nombre,this.registroPlanAuditoria.res.Id,  this.registroPlanAuditoria.res.Enlace)
          },
          error: (error) => {
            console.error("Error al subir el documento", error);
          },
        });
    }
  }

  guardarReferenciaPdf(id: number, nuexoId: number, nuexoEnlace: string): void {
    if (nuexoEnlace !== "") {
      const payload = {
        "referencia_tipo": "Plan Auditoria",
        "referencia_id": id,
        "nuxeo_id": nuexoId,
        "nuxeo_enlace": nuexoEnlace,
        "tipo_id": 0,
        "activo": true,
        "fecha_creacion": new Date().toISOString()
      };
  
      // Validar si el registro ya existe
      this.planAnualAuditoriaService
        .get(`documento?referencia_id=${id}`)
        .subscribe({
          next: (response) => {
            if (response && response.length > 0) {
              // Si el registro existe, realizar un PUT
              const documentoId = response[0].id; // Suponiendo que el ID del documento está en `response[0].id`
              console.log("actualizacion payload", payload)

              this.planAnualAuditoriaService
                .put(`documento/${documentoId}`, payload)
                .subscribe({
                  next: (putResponse) => {
                    console.log("Documento actualizado exitosamente", putResponse);
                  },
                  error: (putError) => {
                    console.error("Error al actualizar el documento", putError);
                  },
                });
            } else {
              // Si el registro no existe, realizar un POST
              console.log("registro payload", payload)
              this.planAnualAuditoriaService
                .post("documento", payload)
                .subscribe({
                  next: (postResponse) => {
                    console.log("Documento registrado exitosamente", postResponse);
                  },
                  error: (postError) => {
                    console.error("Error al registrar el documento", postError);
                  },
                });
            }
          },
          error: (getError) => {
            console.error("Error al verificar la existencia del documento", getError);
          },
        });
    }
  }
  
}
