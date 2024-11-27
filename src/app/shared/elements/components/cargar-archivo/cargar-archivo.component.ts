import {
  Component,
  ElementRef,
  Inject,
  ViewChild,
  inject,
} from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { GestorDocumentalService } from "src/app/core/services/gestor-documental.service";
import { lambdaService } from "src/app/core/services/lambda.service";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: "app-cargar-archivo",
  templateUrl: "./cargar-archivo.component.html",
  styleUrl: "./cargar-archivo.component.css",
})
export class CargarArchivoComponent {
  archivo: File | null = null;

  @ViewChild("fileInput", { static: false }) fileInput!: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<CargarArchivoComponent>,
    private gestorDocumentalService: GestorDocumentalService,
    private lambdaService: lambdaService,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: { tipoArchivo: string; id: string }
  ) {}

  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;

    if (file) {
      if (this.data.tipoArchivo === "pdf" && file.type !== "application/pdf") {
        alert("Por favor seleccione un archivo PDF.");
        this.removerArchivo();
        return;
      }

      if (
        this.data.tipoArchivo === "xlsx" &&
        file.type !==
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        alert("Por favor seleccione un archivo XLSX.");
        this.removerArchivo();
        return;
      }

      this.archivo = file;
    }
  }

  onFileInputClick(): void {
    this.fileInput.nativeElement.click();
  }

  removerArchivo(): void {
    this.archivo = null;
    this.fileInput.nativeElement.value = "";
  }

  cargarArchivo(): void {
    if (!this.archivo) {
      //this.errorMessage = 'No se ha seleccionado ningún archivo.';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64String = e.target.result.split(",")[1];

      const lambdaPayload = {
        base64data: base64String,
        complement: { plan_auditoria_id: this.data.id },
        type_upload: "auditorias",
      };

      const payload = [
        {
          IdTipoDocumento: 1,
          nombre: this.archivo!.name,
          descripcion: "Documento prueba",
          metadatos: {},
          file: base64String,
        },
      ];

      this.lambdaService
        .post("cargue-masivo/auditorias", lambdaPayload)
        .subscribe({
          next: (response) => {
            console.log("Archivo enviado exitosamente al MID", response);
          },
          error: (error) => {
            console.error("Error al enviar el archivo al MID", error);
          },
        });

      this.gestorDocumentalService
        .postAny("document/uploadAnyFormat", payload)
        .subscribe({
          next: (response) => {
            console.log("Documento subido exitosamente", response);
          },
          error: (error) => {
            console.error("Error al subir el documento", error);
          },
        });
    };
    reader.readAsDataURL(this.archivo);
  }
}
