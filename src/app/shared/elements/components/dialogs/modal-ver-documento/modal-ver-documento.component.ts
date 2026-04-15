import { Component, Inject, Input, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

interface DocumentoMultiple {
  titulo: string;
  base64: string;
  guardado: boolean;
  firmado?: boolean;
}

interface ModalDocumentoMultipleData {
  modoMultiple: boolean;
  documentos: Array<{ titulo: string; base64: string; guardado?: boolean; firmado?: boolean }>;
}

@Component({
  selector: "app-modal-ver-documento",
  templateUrl: "./modal-ver-documento.component.html",
  styleUrl: "./modal-ver-documento.component.css",
})
export class ModalVerDocumentoComponent implements OnInit {
  @Input() botonGuardar = { icono: "", texto: "" };
  @Input() botonGuardarTodos = { icono: "", texto: "" };
  @Input() onGuardarIndividual?: (indice: number) => void;
  @Input() onGuardarTodos?: () => void;
  documentoSrc: any;
  documentoSeleccionadoSrc: Uint8Array | null = null;
  modoMultiple: boolean = false;
  documentosMultiples: DocumentoMultiple[] = [];
  indiceSeleccionado: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public documentoBase64: any,
    public dialogRef: MatDialogRef<ModalVerDocumentoComponent>
  ) {}

  ngOnInit(): void {
    this.configurarDocumento();
  }

  private configurarDocumento(): void {
    if (this.esModoMultiple(this.documentoBase64)) {
      this.modoMultiple = true;
      this.documentosMultiples = this.documentoBase64.documentos.map((documento) => ({
        titulo: documento.titulo,
        base64: documento.base64,
        guardado: !!documento.guardado,
        firmado: documento.firmado,
      }));
      this.seleccionarDocumento(0);
      return;
    }

    const arrayBuffer = this.base64ToArrayBuffer(this.documentoBase64);
    this.documentoSrc = new Uint8Array(arrayBuffer);
  }

  private esModoMultiple(data: any): data is ModalDocumentoMultipleData {
    return !!data && data.modoMultiple === true && Array.isArray(data.documentos);
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

  guardar() {
    this.dialogRef.close({
      accion: "guardarDocumento",
    });
  }

  seleccionarDocumento(indice: number): void {
    this.indiceSeleccionado = indice;
    const base64Seleccionado = this.documentosMultiples[indice]?.base64;
    this.documentoSeleccionadoSrc = base64Seleccionado
      ? new Uint8Array(this.base64ToArrayBuffer(base64Seleccionado))
      : null;
  }

  guardarIndividual(indice: number = this.indiceSeleccionado): void {
    if (this.onGuardarIndividual) {
      this.onGuardarIndividual(indice);
      return;
    }

    this.marcarGuardado(indice);

    this.dialogRef.close({
      accion: "guardarDocumento",
      indice,
    });
  }

  guardarTodas(): void {
    if (this.onGuardarTodos) {
      this.onGuardarTodos();
      return;
    }

    this.documentosMultiples.forEach((_, indice) => this.marcarGuardado(indice));

    this.dialogRef.close({
      accion: "guardarTodos",
    });
  }

  marcarGuardado(indice: number): void {
    if (indice >= 0 && indice < this.documentosMultiples.length) {
      this.documentosMultiples[indice].guardado = true;
    }
  }
}
