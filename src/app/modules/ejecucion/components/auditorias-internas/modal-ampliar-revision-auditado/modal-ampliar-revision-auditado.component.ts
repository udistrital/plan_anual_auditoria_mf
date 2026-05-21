import Holidays from 'date-holidays';
import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { firstValueFrom } from "rxjs";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { AlertService } from "src/app/shared/services/alert.service";

export interface ModalAmpliarRevisionData {
  informeId: string;
  fechaFinRevision: Date | string;
  diasRevision: number;
  usuarioId: number;
}

@Component({
  selector: "app-modal-ampliar-revision-auditado",
  templateUrl: "./modal-ampliar-revision-auditado.component.html",
  styleUrl: "./modal-ampliar-revision-auditado.component.css",
  standalone: false,
})
export class ModalAmpliarRevisionAuditadoComponent implements OnInit {
  form!: FormGroup;
  fechaActual!: Date;
  fechaActualTexto!: string;
  minFechaNueva!: Date;

  private readonly _hd = new Holidays('CO');
  private readonly _festivosCache: Record<number, Set<string>> = {};

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ModalAmpliarRevisionData,
    public dialogRef: MatDialogRef<ModalAmpliarRevisionAuditadoComponent>,
    private fb: FormBuilder,
    private alertService: AlertService,
    private planAuditoriaService: PlanAnualAuditoriaService,
  ) {}

  ngOnInit(): void {
    this.fechaActual = new Date(this.data.fechaFinRevision);
    this.fechaActualTexto = this.fechaActual.toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    this.minFechaNueva = new Date(this.fechaActual);
    this.minFechaNueva.setDate(this.minFechaNueva.getDate() + 1);

    this.form = this.fb.group({
      nuevaFechaFin: [null, Validators.required],
    });
  }

  confirmar(): void {
    if (this.form.invalid) {
      this.alertService.showErrorAlert("Debe seleccionar una nueva fecha de revisión.");
      return;
    }

    this.alertService
      .showConfirmAlert("¿Está seguro(a) de ampliar el plazo de revisión del auditado?")
      .then(async (confirmado) => {
        if (!confirmado.value) return;
        await this.guardarAmpliacion(this.form.get('nuevaFechaFin')!.value);
      });
  }

  private async guardarAmpliacion(nuevaFecha: Date): Promise<void> {
    try {
      const diasAdicionales = this.calcularDiasHabilesAdicionales(this.fechaActual, nuevaFecha);
      const diasRevisionTotal = this.data.diasRevision + diasAdicionales;

      await firstValueFrom(
        this.planAuditoriaService.put(`informe/${this.data.informeId}`, {
          fecha_fin_revision: nuevaFecha,
          dias_revision: diasRevisionTotal,
          ampliacion_revision_auditor_id: this.data.usuarioId,
        })
      );

      this.alertService.showSuccessAlert(
        "El plazo de revisión fue ampliado correctamente.",
        "Plazo ampliado"
      );
      this.dialogRef.close(true);
    } catch {
      this.alertService.showErrorAlert("Error al actualizar el plazo de revisión.");
    }
  }

  private calcularDiasHabilesAdicionales(desde: Date, hasta: Date): number {
    const cursor = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
    const fin = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
    let count = 0;

    cursor.setDate(cursor.getDate() + 1);

    while (cursor <= fin) {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) {
        const year = cursor.getFullYear();
        if (!this._festivosCache[year]) {
          const festivos = this._hd.getHolidays(year)
            .filter(h => h.type === 'public')
            .map(h => h.date.substring(0, 10));
          this._festivosCache[year] = new Set(festivos);
        }
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        if (!this._festivosCache[year].has(key)) count++;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  }
}
