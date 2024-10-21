import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';

@Component({
  selector: 'app-cargar-archivo',
  templateUrl: './cargar-archivo.component.html',
  styleUrl: './cargar-archivo.component.css',
})
export class CargarArchivoComponent {
  archivo: File | null = null;

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<CargarArchivoComponent>,
    private gestorDocumentalService: GestorDocumentalService
  ) {}

  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;

    if (file) {
      if (file.type === 'application/pdf') {
        this.archivo = file;
      } else {
      }
    }
  }

  onFileInputClick(): void {
    this.fileInput.nativeElement.click();
  }

  removerArchivo(): void {
    this.archivo = null;
    this.fileInput.nativeElement.value = '';
  }

  cargarArchivo(): void {
    if (!this.archivo) {
      //this.errorMessage = 'No se ha seleccionado ningún archivo.';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64String = e.target.result.split(',')[1];

      const payload = [
        {
          IdTipoDocumento: 1,
          nombre: this.archivo!.name,
          descripcion: 'Documento prueba',
          metadatos: {},
          file: base64String,
        },
      ];

      this.gestorDocumentalService
        .postAny('/document/uploadAnyFormat', payload)
        .subscribe({
          next: (response) => {
            console.log('Documento subido exitosamente', response);
          },
          error: (error) => {
            console.error('Error al subir el documento', error);
          },
        });
    };
    reader.readAsDataURL(this.archivo);
  }
}
