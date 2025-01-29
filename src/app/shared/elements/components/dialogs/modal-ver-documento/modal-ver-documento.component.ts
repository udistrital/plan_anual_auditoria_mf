import { Component, Inject, Input, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: "app-modal-ver-documento",
  templateUrl: "./modal-ver-documento.component.html",
  styleUrl: "./modal-ver-documento.component.css",
})
export class ModalVerDocumentoComponent implements OnInit {
  @Input() botonGuardar = { icono: "", texto: "" };
  documentoSrc: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public documentoBase64: any,
    public dialogRef: MatDialogRef<ModalVerDocumentoComponent>
  ) {}

  ngOnInit(): void {
    const arrayBuffer = this.base64ToArrayBuffer(this.documentoBase64);
    this.documentoSrc = new Uint8Array(arrayBuffer);
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
}
