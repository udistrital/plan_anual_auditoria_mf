import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ErrorCargueHallazgo,
  HallazgoExterno,
} from 'src/app/shared/data/models/registro-auditoria-externa';

/** Lo que se muestra: la vista previa de los hallazgos válidos, o los errores del archivo. */
export interface DatosModalCargueHallazgos {
  nombreArchivo: string;
  hallazgos: HallazgoExterno[];
  errores: ErrorCargueHallazgo[];
  /** Mensaje general cuando el archivo no se pudo leer o no trae errores por fila. */
  mensaje?: string;
}

/** Decisión del auditor: sumar los hallazgos a la tabla o elegir otro archivo. */
export type AccionCargueHallazgos = 'agregar' | 'recargar';

@Component({
  selector: 'app-modal-cargue-hallazgos-externos',
  templateUrl: './modal-cargue-hallazgos-externos.component.html',
  styleUrl: './modal-cargue-hallazgos-externos.component.css',
  standalone: false,
})
export class ModalCargueHallazgosExternosComponent {
  readonly columnasHallazgos = ['numeral', 'vigencia', 'codigo', 'descripcion', 'dependencias'];
  readonly columnasErrores = ['fila', 'columna', 'motivo'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DatosModalCargueHallazgos,
    private readonly dialogRef: MatDialogRef<
      ModalCargueHallazgosExternosComponent,
      AccionCargueHallazgos
    >,
  ) {}

  get hayErrores(): boolean {
    return this.data.errores.length > 0 || !!this.data.mensaje;
  }

  agregar(): void {
    this.dialogRef.close('agregar');
  }

  recargar(): void {
    this.dialogRef.close('recargar');
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
