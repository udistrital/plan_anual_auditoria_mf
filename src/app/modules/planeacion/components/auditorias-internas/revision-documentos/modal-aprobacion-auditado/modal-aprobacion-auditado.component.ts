import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NuxeoService } from 'src/app/core/services/nuxeo.service';
import { ReferenciaPdfService } from 'src/app/core/services/referencia-pdf.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-modal-aprobacion-auditado',
  templateUrl: './modal-aprobacion-auditado.component.html',
})
export class ModalAprobacionAuditadoComponent {
  @ViewChild("fileInput", { static: false }) fileInput!: ElementRef;
  
  archivo: File | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public infoModal: any,
    private readonly dialogRef: MatDialogRef<ModalAprobacionAuditadoComponent>,
    private readonly alertService: AlertService,
    private readonly nuxeoService: NuxeoService,
    private readonly referenciaPdfService: ReferenciaPdfService,
  ) {}

  onArchivoSelecionado(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (file.type !== "application/pdf") {
        alert("Por favor, seleccione un archivo en formato PDF.");
        this.removerArchivo();
        input.value = "";
        return;
      }

      this.archivo = file;
    } else {
      alert("No se seleccionó ningún archivo.");
    }
  }

  onArchivoInputClick(): void {
    this.fileInput.nativeElement.click();
  }

  removerArchivo(): void {
    this.archivo = null;
    this.fileInput.nativeElement.value = "";
  }

  cargarArchivo(): void {
    if (!this.archivo) {
      this.alertService.showErrorAlert("Debe seleccionar un archivo");
    }

    const payload = [
      {
        IdTipoDocumento: environment.TIPO_DOCUMENTO.PROGRAMA_TRABAJO_AUDITORIA,
        nombre: this.archivo!.name,
        descripcion: "Carta de representación firmada",
        metadatos: {},
        file: this.archivo
      }
    ];
    
    this.nuxeoService.guardarArchivos(payload).subscribe({
      next: (response) => {
        console.log("Archivo cargado exitosamente", response);
        this.guardarReferencia(response[0], "Carta de representación firmada", this.infoModal.auditoria_id, environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION)
      }
    })
  }

  guardarReferencia(nuxeoResponse: any, referencia_tipo: string, referencia_id: string, tipo_id: number): void {
    if (nuxeoResponse.res.Enlace) {


      const metadatos = {
          firmado: true
      }
      this.referenciaPdfService.guardarReferencia(nuxeoResponse.res, referencia_tipo, referencia_id, tipo_id, metadatos).subscribe({
        next: (response) => {
          console.log("Referencia guardada exitosamente", response);
          this.alertService.showSuccessAlert("Archivo subido exitosamente.").then(() =>
            this.aceptarAuditoriaAuditado(true)
          )
        },
        error: (error) => {
          console.error("Error al guardar la referencia", error);
        }
      });
    }
  }

  aceptarAuditoriaAuditado(aprobado: boolean = false): void {
    this.dialogRef.close(aprobado);
  }

  cancelar():void {
    this.dialogRef.close(false);
  }
}
