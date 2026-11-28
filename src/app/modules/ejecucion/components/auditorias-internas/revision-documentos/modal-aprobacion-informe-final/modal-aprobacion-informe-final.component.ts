import { Component, Inject } from "@angular/core";
import { FormGroup, FormBuilder } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

/**
 * Modal del Jefe OCI para aprobar el informe final (issue #958).
 * Permite ver y modificar la fecha de emisión final antes de aprobar.
 * La fecha es opcional: si no se selecciona, se aprueba sin modificarla.
 *
 * Al confirmar, el modal se cierra devolviendo la fecha seleccionada (ISO) o null
 * si no se eligió. La aprobación, firma y cambios de estado los ejecuta el padre.
 */
@Component({
  selector: "app-modal-aprobacion-informe-final",
  templateUrl: "./modal-aprobacion-informe-final.component.html",
  standalone: false,
})
export class ModalAprobacionInformeFinalComponent {
  formAprobacion!: FormGroup;

  titulo = "Aprobación del Informe Final";
  descripcion =
    "Al aprobar, el Informe Final será firmado electrónicamente. Si lo requiere, ajuste la fecha de emisión final (opcional).";
  botonConfirmar = "Aprobar Informe Final";
  fechaMinima = new Date(2024, 0, 1);

  constructor(
    @Inject(MAT_DIALOG_DATA) public infoModal: any,
    public readonly dialogRef: MatDialogRef<ModalAprobacionInformeFinalComponent>,
    private readonly fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    const fechaInicial = this.infoModal?.fechaEmisionFinal
      ? new Date(this.infoModal.fechaEmisionFinal)
      : null;
    this.formAprobacion = this.fb.group({
      fecha_emision_final: [fechaInicial],
    });
  }

  confirmar(): void {
    const fecha: Date | null = this.formAprobacion.get("fecha_emision_final")?.value ?? null;
    this.dialogRef.close({ fecha_emision_final: fecha ? fecha.toISOString() : null });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
