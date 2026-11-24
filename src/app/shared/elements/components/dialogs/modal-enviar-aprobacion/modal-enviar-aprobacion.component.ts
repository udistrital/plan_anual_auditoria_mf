import { Component, Inject, Optional } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

/** Datos opcionales con los que se puede abrir el modal. */
export interface ModalEnviarAprobacionData {
  /** Activa la línea gráfica homologada del encabezado (`plantilla-modal [homologado]`). */
  homologado?: boolean;
}

@Component({
  selector: "app-modal-enviar-aprobacion",
  templateUrl: "./modal-enviar-aprobacion.component.html",
  styleUrls: ["./modal-enviar-aprobacion.component.css"],
  standalone: false,
})
export class ModalEnviarAprobacionComponent {
  form: FormGroup;
  readonly preguntaConfirmacion = "¿Está seguro(a) de enviar esta auditoría a aprobación por Jefe?";
  readonly homologado: boolean;

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<ModalEnviarAprobacionComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) data: ModalEnviarAprobacionData | null
  ) {
    this.homologado = data?.homologado ?? false;
    this.form = this.fb.group({
      observacion: [""],
    });

    this.dialogRef.beforeClosed().subscribe((result) => {
      if (result === undefined) {
        this.dialogRef.close(null);
      }
    });
  }

  confirmar(): void {
    this.dialogRef.close(this.form.value.observacion ?? "");
  }
}
