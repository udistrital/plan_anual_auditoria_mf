import { Component, Input, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {ModalService} from 'src/app/services/modal.service'
import {GestorDocumentalService} from 'src/app/services/gestor-documental.service'
@Component({
  selector: 'app-pdf-visualizador',
  templateUrl: './pdf-visualizador.component.html',
  styleUrls: ['./pdf-visualizador.component.css']
})
export class PdfVisualizadorComponent implements OnInit {

  @ViewChild('pdfCanvas', { static: true }) pdfCanvas!: ElementRef<HTMLCanvasElement>;
  private base64='';
  pdfLoaded = false;
  pdfSrc: Uint8Array | undefined;
  constructor(@Inject(MAT_DIALOG_DATA) public data: { base64Document: string, id: string },    private modalService: ModalService, private gestorDocumentalService: GestorDocumentalService) { }

  ngOnInit() {
    const documentSource = this.data.base64Document;
    if (documentSource) {
      this.loadPdfFromBase64(documentSource);
    } else {
      console.error('No se proporcionó un documento PDF');
    }
  }

  loadPdfFromBase64(base64: string) {
    this.base64=base64;
    try {
      console.log("render", this.base64)
      const arrayBuffer = this.base64ToArrayBuffer(this.base64);
      this.pdfSrc = new Uint8Array(arrayBuffer);
      this.pdfLoaded = true;
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }

  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);  // Decodifica Base64
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;  // Retorna el ArrayBuffer
  }
  
  guardarPdf(){
    if(this.base64!==''){
      const payload = [
        {
          IdTipoDocumento: 1,
          nombre: this.data.id,
          descripcion: 'Documento pdf, auditorias de plan de auditoria',
          metadatos: {},
          file: this.base64,
        },
      ];
      this.gestorDocumentalService.postAny('/document/uploadAnyFormat',payload)
      .subscribe({
        next: (response) => {
          console.log('Documento subido exitosamente', response);
        },
        error: (error) => {
          console.error('Error al subir el documento', error);
        },
      });
    }
  }



}
