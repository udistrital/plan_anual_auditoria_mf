import { Component, ElementRef, Inject, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { AlertService } from "src/app/shared/services/alert.service";
import { GestorDocumentalService } from "src/app/core/services/gestor-documental.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { CargarArchivoComponent } from "src/app/shared/elements/components/cargar-archivo/cargar-archivo.component";
import { environment } from "src/environments/environment";
import { Router } from "@angular/router";

@Component({
  selector: "app-modal-aprobacion-secretario",
  templateUrl: "./modal-aprobacion-secretario.component.html",
  styleUrl: "./modal-aprobacion-secretario.component.css",
})
export class ModalAprobacionSecretarioComponent {
  @ViewChild("fileInput", { static: false }) fileInput!: ElementRef;

  archivo: File | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public infoModal: any,
    public dialogRef: MatDialogRef<ModalAprobacionSecretarioComponent>,
    private dialog: MatDialog,
    private alertService: AlertService,
    private gestorDocumentalService: GestorDocumentalService,
    private planAuditoriaService: PlanAnualAuditoriaService,
    private router: Router
  ) {}

  onFileSelected(event: Event): void {
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

  onFileInputClick(): void {
    this.fileInput.nativeElement.click();
  }

  removerArchivo(): void {
    this.archivo = null;
    this.fileInput.nativeElement.value = "";
  }

  cargarArchivo(): void {
    if (!this.archivo) {
      this.alertService.showErrorAlert("Debe seleccionar un archivo");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64String = e.target.result.split(",")[1];

      const lambdaPayload = {
        base64data: base64String,
      };

      const payload = [
        {
          IdTipoDocumento: environment.TIPO_DOCUMENTO.ACTA_COMITE_COORDINADOR,
          nombre: this.archivo!.name,
          descripcion: "Acta de comite coordinador",
          metadatos: {},
          file: base64String,
        },
      ];

      this.gestorDocumentalService
        .postAny("/document/uploadAnyFormat", payload)
        .subscribe({
          next: (response) => {
            this.aceptarPlanAuditoria();
          },
        });
    };
    reader.readAsDataURL(this.archivo);
  }

  aceptarPlanAuditoria(): void {
    const planEstado = this.construirObjetoPlanEstado(
      this.infoModal.planAuditoriaId, 
      environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID
    );

    this.planAuditoriaService.post("estado", planEstado).subscribe(
      () => {
        this.alertService.showSuccessAlert("Plan aprobado");
        this.dialogRef.close();
        this.router.navigate([
          `/programacion/plan-auditoria/`
        ]);
      },
      (error) => {
        this.alertService.showErrorAlert("Error al aprobar el plan");
        console.error(error);
      }
    );
  }

  construirObjetoPlanEstado(planId: string, estadoId: number, observacion = "") {
    return {
      plan_auditoria_id: planId,
      usuario_id: this.infoModal.usuarioId,
      observacion,
      estado_id: estadoId,
    };
  }
}
