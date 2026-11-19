import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  buscarHallazgoDuplicado,
  HallazgoExterno,
} from 'src/app/shared/data/models/registro-auditoria-externa';

export interface OpcionCatalogo {
  Id: number;
  Nombre: string;
}

export interface DatosModalHallazgoExterno {
  /** Hallazgo a editar; null para uno nuevo. */
  hallazgo: HallazgoExterno | null;
  /** Posición del hallazgo editado en la lista (para no chocar consigo mismo). */
  indice: number | null;
  existentes: HallazgoExterno[];
  vigencias: OpcionCatalogo[];
  dependencias: OpcionCatalogo[];
}

/** Alta o edición de un hallazgo de auditoría externa, uno a uno. */
@Component({
  selector: 'app-modal-hallazgo-externo',
  templateUrl: './modal-hallazgo-externo.component.html',
  styleUrl: './modal-hallazgo-externo.component.css',
  standalone: false,
})
export class ModalHallazgoExternoComponent {
  readonly form: FormGroup;
  readonly esEdicion: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DatosModalHallazgoExterno,
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<ModalHallazgoExternoComponent, HallazgoExterno>,
  ) {
    const h = data.hallazgo;
    this.esEdicion = !!h;
    this.form = this.fb.group({
      vigencia_pad: [h?.vigencia_pad ?? null, Validators.required],
      codigo_auditoria_pad: [
        h?.codigo_auditoria_pad ?? '',
        [Validators.required, Validators.maxLength(50)],
      ],
      numeral: [h?.numeral ?? '', [Validators.required, Validators.maxLength(50)]],
      descripcion: [h?.descripcion ?? '', [Validators.required, Validators.maxLength(2000)]],
      dependencia_id: [h?.dependencia_id ?? [], Validators.required],
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valor = this.form.getRawValue();
    const candidato = {
      codigo_auditoria_pad: String(valor.codigo_auditoria_pad).trim(),
      numeral: String(valor.numeral).trim(),
    };
    const repetido = buscarHallazgoDuplicado(this.data.existentes, candidato, this.data.indice);
    if (repetido >= 0) {
      this.form.get('numeral')?.setErrors({ duplicado: repetido + 1 });
      this.form.get('numeral')?.markAsTouched();
      return;
    }

    const ids: number[] = [...valor.dependencia_id];
    this.dialogRef.close({
      vigencia_pad: Number(valor.vigencia_pad),
      vigencia_nombre: this.nombreDe(this.data.vigencias, Number(valor.vigencia_pad)),
      ...candidato,
      descripcion: String(valor.descripcion).trim(),
      dependencia_id: ids,
      dependencias_nombre: ids.map((id) => this.nombreDe(this.data.dependencias, id)),
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private nombreDe(catalogo: OpcionCatalogo[], id: number): string {
    return catalogo.find((o) => o.Id === id)?.Nombre ?? String(id);
  }
}
