import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-documentos-anexos-auditoria',
  templateUrl: './documentos-anexos-auditoria.component.html',
  styleUrls: ['./documentos-anexos-auditoria.component.css']
})
export class DocumentosAnexosAuditoriaComponent {
  @Output() guardarDocumentos = new EventEmitter<any>();
  
  formularioDocumentos: FormGroup;

  documentos = [
    { nombre: 'Oficio Anuncio Solicitud de Información', archivo: null },
    { nombre: 'Carta de Representación', archivo: null },
    { nombre: 'Compromiso Ético', archivo: null }
  ];

  constructor(private fb: FormBuilder) {
    this.formularioDocumentos = this.fb.group({
      campoDocumentos: ['', Validators.required]
    });
  }

  onArchivoSeleccionado(event: any, index: number): void {
    const file = event.target.files[0];
    this.documentos[index].archivo = file;
  }

  onGuardar() {
    if (this.formularioDocumentos.valid) {
      this.guardarDocumentos.emit(this.documentos);
    }
  }
}
