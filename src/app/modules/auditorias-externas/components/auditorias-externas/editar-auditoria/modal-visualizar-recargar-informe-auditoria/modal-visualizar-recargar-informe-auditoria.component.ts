import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

/** Lo que el auditor pide hacer con el PDF que está viendo. */
export type AccionInformeModal = 'cambiar' | 'quitar';

/**
 * Vista previa del informe final elegido en el registro de una auditoría externa.
 * El archivo aún no se sube: el modal solo lo muestra y devuelve la acción pedida.
 */
@Component({
  selector: 'app-modal-visualizar-recargar-informe-auditoria',
  templateUrl: './modal-visualizar-recargar-informe-auditoria.component.html',
  styleUrl: './modal-visualizar-recargar-informe-auditoria.component.css',
  standalone: false,
})
export class ModalVisualizarRecargarInformeAuditoriaComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { base64Document: string; nombre?: string; tamanio?: string },
    private readonly dialogRef: MatDialogRef<
      ModalVisualizarRecargarInformeAuditoriaComponent,
      AccionInformeModal
    >,
  ) {}

  cambiarDocumento(): void {
    this.dialogRef.close('cambiar');
  }

  quitarDocumento(): void {
    this.dialogRef.close('quitar');
  }
}
