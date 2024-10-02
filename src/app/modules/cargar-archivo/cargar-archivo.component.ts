import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-cargar-archivo',
  templateUrl: './cargar-archivo.component.html',
  styleUrl: './cargar-archivo.component.css'
})
export class CargarArchivoComponent {

  archivo: string | null = null;

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  
  constructor(public dialogRef: MatDialogRef<CargarArchivoComponent>) { }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.archivo = file.name;
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
    if (this.archivo) {
      console.log(`Archivo ${this.archivo} subido`);
      this.dialogRef.close();
    }
  }

}
