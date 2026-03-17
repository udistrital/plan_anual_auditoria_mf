import { Component, ElementRef, Inject, ViewChild } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from "@angular/material/dialog";
import { AlertService } from "src/app/shared/services/alert.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
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
    private planAuditoriaService: PlanAnualAuditoriaService,
    private nuxeoService: NuxeoService,
    private referenciaPdfService: ReferenciaPdfService,
    private router: Router
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
      return;
    }

    const payload = [
      {
        IdTipoDocumento: environment.TIPO_DOCUMENTO.ACTA_COMITE_COORDINADOR,
        nombre: this.archivo!.name,
        descripcion: "Acta de comité coordinador",
        metadatos: {},
        file: this.archivo,
      },
    ];

    this.nuxeoService.guardarArchivos(payload).subscribe({
      next: (response) => {
        console.log("Archivo cargado exitosamente", response);
        this.guardarReferencia(
          response[0],
          "Plan Auditoria",
          this.infoModal.planAuditoriaId,
          6820
        );
        this.aceptarPlanAuditoria();
      },
      error: (error) => {
        console.error("Error al cargar el archivo en Nuxeo", error);
        this.alertService.showErrorAlert("Error al cargar el archivo");
      },
    });
  }

  guardarReferencia(
    nuxeoResponse: any,
    referencia_tipo: string,
    referencia_id: string,
    tipo_id: number
  ): void {
    if (nuxeoResponse.res.Enlace) {
      this.referenciaPdfService
        .guardarReferencia(
          nuxeoResponse.res,
          referencia_tipo,
          referencia_id,
          tipo_id
        )
        .subscribe({
          next: (response) => {
            console.log("Referencia guardada exitosamente", response);
            this.alertService.showSuccessAlert("Archivo subido exitosamente.");
          },
          error: (error) => {
            console.error("Error al guardar la referencia", error);
          },
        });
    }
  }

  aceptarPlanAuditoria(): void {
    const planEstado = this.construirObjetoPlanEstado(
      this.infoModal.planAuditoriaId,
      environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID
    );

    this.planAuditoriaService.post("estado", planEstado).subscribe({
      next: (resp: any) => {
        if (resp.Success) {
          const generarAuditoriasDto = {
            usuario_id: this.infoModal.usuarioId,
            usuario_rol: this.infoModal.usuarioRol,
            observacion: "Generación automática de auditorías luego de aprobación del plan por parte del secretario técnico",
            "estado_id_padre_actual": environment.AUDITORIA_PADRE_ESTADO.BORRADOR_ID,
            "estado_id_padre_nuevo": environment.AUDITORIA_PADRE_ESTADO.APROBADA_PAA_ID,
            "estado_id_hija_nuevo": environment.AUDITORIA_ESTADO.PROGRAMACION.POR_ASIGNAR,
            fase_id: environment.AUDITORIA_FASE.PROGRAMACION,
          }
          this.planAuditoriaService.post(`plan-auditoria/${this.infoModal.planAuditoriaId}/generar-auditorias`, generarAuditoriasDto)
            .subscribe({
              next: (response: any) => {
                if (response.Status === 200) {
                  this.mostrarMensajeExito();
                } else {
                  console.error("Error al actualizar el estado de las auditorías.");
                  this.mostrarMensajeExito();
                }
              },
              error: (error) => {
                this.alertService.showErrorAlert("Error al actualizar el estado de las auditorías.");
                console.error(error);
              }
            });
        }
      },
      error: (error) => {
        this.alertService.showErrorAlert("Error al aprobar el plan");
        console.error(error);
      }
    });
  }

  mostrarMensajeExito(): void {
    this.alertService.showSuccessAlert(
      "Plan aprobado exitosamente."
    ).then(() => {
      this.dialogRef.close();
      this.router.navigate([`/programacion/plan-auditoria/`]);
    });
  }

  construirObjetoPlanEstado(
    planId: string,
    estadoId: number,
    observacion = ""
  ) {
    return {
      plan_auditoria_id: planId,
      usuario_id: this.infoModal.usuarioId,
      observacion,
      estado_id: estadoId,
    };
  }
}
