import { PlanAnualAuditoriaMid } from './../../../../core/services/plan-anual-auditoria-mid.service';
import { MatTableDataSource } from '@angular/material/table';
import {
  Component,
  ElementRef,
  Inject,
  ViewChild,
  inject,
} from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { GestorDocumentalService } from "src/app/core/services/gestor-documental.service";
import { HttpClient } from "@angular/common/http";
import { ModalService } from 'src/app/shared/services/modal.service';
import { AlertService } from "src/app/shared/services/alert.service";

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
    private PlanAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private alertService: AlertService,
    private http: HttpClient,
    private modalService: ModalService,
    @Inject(MAT_DIALOG_DATA) public data: {
      tipoArchivo: string;
      idTipoDocumento: number;
      descripcion: string;
      id: string;
      vigenciaId: number;
      cargaLambda: boolean;
      tipo: string;
    }
  ) { }

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
      let lambdaPayload: any = {};
      if (this.data.cargaLambda) {
        switch (this.data.tipo) {
          case "auditorias":
            lambdaPayload = {
              base64data: base64String,
              complement: { plan_auditoria_id: this.data.id, vigencia_id: 6619 },
              type_upload: "auditorias",
            };
            break;
          case "actividades":
            lambdaPayload = {
              base64data: base64String,
              complement: { auditoria_id: this.data.id },
              type_upload: "actividades",
            };
            break;
        }

        /*lambdaPayload = {
          base64data: base64String,
          complement: { plan_auditoria_id: this.data.id, vigencia_id: 6619 },
          type_upload: "auditorias",
        };*/



        this.PlanAnualAuditoriaMid
          .post(`cargue-masivo/${this.data.tipo}`, lambdaPayload)
          .subscribe({
            next: (response: any) => {
              console.log("Archivo enviado exitosamente al MID", response);
              if (response && response.Data) {
                this.resultados(response.Data);
              }
            },
            error: (error) => {
              console.error("Error al enviar el archivo al MID", error);
            },
          });
      }

      const payload = [
        {
          IdTipoDocumento: this.data.idTipoDocumento,
          nombre: this.archivo!.name,
          descripcion: this.data.descripcion,
          metadatos: {},
          file: base64String,
        },
      ];

      this.gestorDocumentalService
        .postAny("document/uploadAnyFormat", payload)
        .subscribe({
          next: (response) => {
            this.alertService.showSuccessAlert("Documento subido exitosamente");
            console.log("Documento subido exitosamente", response);
            this.dialogRef.close();
          },
          error: (error) => {
            this.alertService.showErrorAlert("Error al subir el documento");
            console.error("Error al subir el documento", error);
          },
        });
    };
    reader.readAsDataURL(this.archivo);
  }

  resultados(data: any): void {
    let mensaje = "";

    if (data.Erróneos?.length > 0) {
      mensaje += `<strong>Se encontraron los siguientes errores en algunos registros:</strong><ul><br>`;
      data.Erróneos.forEach((error: any) => {
        mensaje += `<li><strong>Fila ${error.Idx}:</strong> ${error.Error}</li>`;
      });
      mensaje += `</ul>`;
    }

    if (data.Correctos?.length > 0) {
      mensaje += `<br><strong>Registros correctos:</strong><ul>`;
      mensaje += data.Correctos.join(", ") + '<br><br>';
    }

    this.modalService.mostrarModal(mensaje, 'warning', '');
  }

}
