import { PlanAnualAuditoriaMid } from "./../../../../core/services/plan-anual-auditoria-mid.service";
import { Component, ElementRef, Inject, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { ModalService } from "src/app/shared/services/modal.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { environment } from "src/environments/environment";
import * as XLSX from "xlsx";

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
    private PlanAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private nuxeoService: NuxeoService,
    private alertService: AlertService,
    private modalService: ModalService,
    private referenciaPdfService: ReferenciaPdfService,

    @Inject(MAT_DIALOG_DATA)
    public data: {
      usuario_id: number;
      usuario_rol: string;
      tipoArchivo: string;
      idTipoDocumento: number;
      descripcion: string;
      id: string;
      vigenciaId: number;
      cargaLambda: boolean;
      tipo: string;
      tipoIdReferencia: number;
      referencia: string;
    }
  ) {}

  onArchivoSelecionado(event: any): void {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;

    if (file) {
      if (
        (this.data.tipoArchivo === "pdf" && file.type !== "application/pdf") ||
        (this.data.tipoArchivo === "xlsx" &&
          file.type !==
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      ) {
        alert(
          "Por favor seleccione un archivo válido según el tipo especificado."
        );
        this.removerArchivo();
        return;
      }

      this.archivo = file;
    }
  }

  onArchivoInputClick(): void {
    this.fileInput.nativeElement.click();
  }

  removerArchivo(): void {
    this.archivo = null;
    this.fileInput.nativeElement.value = "";
  }

  async cargarArchivo(): Promise<void> {
    if (!this.archivo) {
      this.alertService.showErrorAlert("No se ha seleccionado ningún archivo.");
      return;
    }

    // Validar fechas del Excel antes de enviar (solo para cargue masivo de actividades)
    if (this.data.cargaLambda && this.data.tipo === "actividades") {
      const erroresFechas = await this.validarFechasExcel(this.archivo);
      if (erroresFechas.length > 0) {
        const filas = erroresFechas
          .map((e) => `• Fila ${e.fila}: ${e.mensaje}`)
          .join("\n");
        this.alertService.showErrorAlert(
          `El archivo contiene errores en las fechas:\n\n${filas}`
        );
        return;
      }
    }

    if (this.data.cargaLambda) {
      this.cargarConLambda().then((success) => {
        if (success) {
          this.cargarConNuxeo().then((nuxeoResponse) => {
            this.guardarReferencia(
              nuxeoResponse,
              this.data.referencia,
              this.data.id,
              0,
              false
            );
          });
        }
      });
    } else {
      this.cargarConNuxeo().then((nuxeoResponse) => {
        this.guardarReferencia(
          nuxeoResponse,
          this.data.referencia,
          this.data.id,
          this.data.tipoIdReferencia,
          true
        );
      });
    }
  }

  /**
   * Lee el Excel y valida que 'Fecha Fin' >= 'Fecha Inicio' en cada fila de datos.
   * Las fechas vienen como texto en formato YYYY-MM-DD según la plantilla.
   * Se agrega T00:00:00 al parsear para evitar desfase de zona horaria (UTC vs local).
   * Omite la fila de instrucciones que contiene texto explicativo.
   */
  private validarFechasExcel(
    archivo: File
  ): Promise<{ fila: number; mensaje: string }[]> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const hoja = workbook.Sheets[workbook.SheetNames[0]];

          // true para leer el texto tal cual sin conversión automática de fechas
          const filas: any[] = XLSX.utils.sheet_to_json(hoja, {
            defval: null,
            raw: true,
          });

          const errores: { fila: number; mensaje: string }[] = [];

          filas.forEach((fila, index) => {
            const numeroFila = index + 2; // +2 porque fila 1 es encabezado

            const valorInicio: string | null = fila["Fecha Inicio"];
            const valorFin: string | null = fila["Fecha Fin"];

            if (
              !valorInicio ||
              !valorFin ||
              String(valorInicio).toLowerCase().includes("texto") ||
              String(valorInicio).toLowerCase().includes("yyyy")
            ) {
              return;
            }

            const valorInicioStr = String(valorInicio).trim();
            const valorFinStr = String(valorFin).trim();

            const fechaInicio = new Date(valorInicioStr + "T00:00:00");
            const fechaFin = new Date(valorFinStr + "T00:00:00");

            if (isNaN(fechaInicio.getTime())) {
              errores.push({
                fila: numeroFila,
                mensaje: `Fecha de inicio inválida: "${valorInicioStr}". Use el formato YYYY-MM-DD.`,
              });
              return;
            }

            if (isNaN(fechaFin.getTime())) {
              errores.push({
                fila: numeroFila,
                mensaje: `Fecha de fin inválida: "${valorFinStr}". Use el formato YYYY-MM-DD.`,
              });
              return;
            }

            // Comparar solo la parte de fecha (sin hora) para evitar falsos positivos
            const inicio = new Date(
              fechaInicio.getFullYear(),
              fechaInicio.getMonth(),
              fechaInicio.getDate()
            );
            const fin = new Date(
              fechaFin.getFullYear(),
              fechaFin.getMonth(),
              fechaFin.getDate()
            );

            if (fin < inicio) {
              errores.push({
                fila: numeroFila,
                mensaje: `La fecha de fin (${valorFinStr}) no puede ser anterior a la fecha de inicio (${valorInicioStr}).`,
              });
            }
          });

          resolve(errores);
        } catch (error) {
          console.error("Error al leer el archivo Excel para validación:", error);
          resolve([]); // Si no se puede leer, dejar pasar y que el backend valide
        }
      };

      reader.onerror = () => resolve([]);
      reader.readAsArrayBuffer(archivo);
    });
  }

  private async cargarConLambda(): Promise<boolean> {
    try {
      const base64 = await this.nuxeoService.fileABase64(this.archivo!);
      console.log("vigencia Masivo", this.data.vigenciaId);

      let payload: any = {};
      switch (this.data.tipo) {
        case "auditorias":
          payload = {
            base64data: base64,
            complement: {
              plan_auditoria_id: this.data.id,
              vigencia_id: this.data.vigenciaId,
              usuario_id: this.data.usuario_id,
              usuario_rol: this.data.usuario_rol,
              fase_id: environment.AUDITORIA_FASE.PROGRAMACION,
              estado_id: environment.AUDITORIA_PADRE_ESTADO.BORRADOR_ID,
            },
            type_upload: "auditorias",
          };
          break;
        case "actividades":
          payload = {
            base64data: base64,
            complemento: { auditoria_id: this.data.id },
            type_upload: "actividades",
          };
          break;
      }

      const response: any = await this.PlanAnualAuditoriaMid.post(
        `cargue-masivo/${this.data.tipo}`,
        payload
      ).toPromise();

      if (response && response.Data) {
        console.log("Archivo enviado exitosamente al MID", response);
        this.resultados(response.Data);
        return true;
      } else {
        this.alertService.showErrorAlert(
          "La respuesta de cargue masivo no contiene datos válidos."
        );
        return false;
      }
    } catch (error: any) {
      console.error("=== ERROR SERVERLESS ===");
      console.error("status:", error?.status);
      console.error("message:", error?.message);
      console.error("error.error:", JSON.stringify(error?.error, null, 2));
      console.error("error completo:", JSON.stringify(error, null, 2));
      console.error("=======================");

      this.alertService.showErrorAlert(
        "Error al enviar el archivo a cargue masivo. Por favor, revise el log."
      );
      return false;
    }
  }

  private async cargarConNuxeo(): Promise<any> {
    const archivoConDatos = {
      IdTipoDocumento: this.data.idTipoDocumento,
      nombre: this.archivo!.name,
      descripcion: this.data.descripcion,
      file: this.archivo!,
    };

    return new Promise((resolve, reject) => {
      this.nuxeoService.guardarArchivos([archivoConDatos]).subscribe({
        next: (response) => {
          console.log("Archivo subido a Nuxeo", response);
          this.dialogRef.close();
          resolve(response[0]);
        },
        error: (error) => {
          this.alertService.showErrorAlert("Error al subir el archivo.");
          console.error("Error al subir el archivo", error);
          reject(error);
        },
      });
    });
  }

  guardarReferencia(
    nuxeoResponse: any,
    referencia_tipo: string,
    referencia_id: string,
    tipo_id: number,
    mostrarMensaje: boolean
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
            if (mostrarMensaje) {
              this.alertService.showSuccessAlert("Archivo subido exitosamente.");
            }
          },
          error: (error) => {
            console.error("Error al guardar la referencia", error);
          },
        });
    }
  }

  resultados(data: any): void {
    const totalCorrectos = data.Correctos?.length ?? 0;
    const totalErroneos = data["Erróneos"]?.length ?? 0;

    if (totalCorrectos > 0 && totalErroneos === 0) {
      this.modalService.mostrarModal(
        `<div style="text-align:center">
          <p style="font-size:2rem; margin:0">✅</p>
          <p style="font-size:1.1rem; margin-top:8px">
            Se cargaron correctamente <strong>${totalCorrectos}</strong> registro(s).
          </p>
        </div>`,
        "success",
        "Cargue exitoso"
      );
      return;
    }

    const icono = totalCorrectos > 0 ? "warning" : "error";
    const titulo =
      totalCorrectos > 0 ? "Cargue con observaciones" : "Cargue fallido";

    let mensaje = "";

    if (totalCorrectos > 0) {
      mensaje += `
        <div style="background:#e8f5e9; border-radius:8px; padding:10px; margin-bottom:12px">
          ✅ <strong>${totalCorrectos}</strong> registro(s) cargado(s) correctamente
          <span style="color:#555; font-size:0.9rem">(filas: ${data.Correctos.join(", ")})</span>
        </div>`;
    }

    if (totalErroneos > 0) {
      mensaje += `
        <div style="background:#ffebee; border-radius:8px; padding:10px; margin-bottom:8px">
          ❌ <strong>${totalErroneos}</strong> registro(s) con error
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:0.9rem; text-align:left">
          <thead>
            <tr style="background:#f5f5f5">
              <th style="padding:6px 10px; border-bottom:2px solid #ddd; width:60px">Fila</th>
              <th style="padding:6px 10px; border-bottom:2px solid #ddd">Error</th>
            </tr>
          </thead>
          <tbody>`;

      data["Erróneos"].forEach((error: any) => {
        mensaje += `
            <tr>
              <td style="padding:6px 10px; border-bottom:1px solid #eee; text-align:center">
                <strong>${error.Idx}</strong>
              </td>
              <td style="padding:6px 10px; border-bottom:1px solid #eee; color:#c62828">
                ${error.Error}
              </td>
            </tr>`;
      });

      mensaje += `</tbody></table>`;
    }

    this.modalService.mostrarModal(mensaje, icono, titulo);
  }
}