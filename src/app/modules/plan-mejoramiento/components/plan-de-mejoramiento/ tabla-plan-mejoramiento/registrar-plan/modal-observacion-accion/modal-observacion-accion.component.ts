import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { environment } from 'src/environments/environment';
import type { AccionPlan } from '../tabla-hallazgos/tabla-hallazgos.component';
import { ModalHistorialObservacionesAccionComponent } from '../modal-historial-observaciones-accion/modal-historial-observaciones-accion.component';

const ESTADO_ACCION = environment.ACCION_MEJORA_ESTADOS;

export interface DatosModalObservacionAccion {
  hallazgo: { indice: string; descripcion: string; causa: string };
  accion: AccionPlan;
  /** Fuera de la revisión del plan el dictamen solo se consulta */
  soloLectura: boolean;
}

export interface ResultadoDictamenAccion {
  estadoId: number;
  observacion: string;
}

/** Modal de revisión y dictamen de una acción de mejora (rol auditor) */
@Component({
  selector: 'app-modal-observacion-accion',
  templateUrl: './modal-observacion-accion.component.html',
  styleUrls: ['./modal-observacion-accion.component.css'],
  standalone: false,
})
export class ModalObservacionAccionComponent implements OnInit {
  readonly MAX_CONCEPTO = 1000;
  readonly ESTADO_ACCION = ESTADO_ACCION;

  readonly opcionesDictamen = [
    {
      estadoId: ESTADO_ACCION.APROBADA,
      titulo: 'Conforme / Aprobada',
      descripcion: 'Cumple los criterios metodológicos y ataca la causa del hallazgo.',
      icono: 'check_circle',
      clase: 'opcion-conforme',
    },
    {
      estadoId: ESTADO_ACCION.RECHAZADA,
      titulo: 'No conforme / Rechazada',
      descripcion: 'Requiere ajustes: no es pertinente, no ataca la causa o es inviable.',
      icono: 'cancel',
      clase: 'opcion-no-conforme',
    },
  ];

  form!: FormGroup;
  ultimoDictamen: { observacion: string; fecha: string } | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DatosModalObservacionAccion,
    private readonly dialogRef: MatDialogRef<ModalObservacionAccionComponent>,
    private readonly dialog: MatDialog,
    private readonly fb: FormBuilder,
    private readonly alertService: AlertService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
  ) {}

  get accion(): AccionPlan {
    return this.data.accion;
  }

  get codigoAccion(): string {
    return `${this.data.hallazgo.indice}.${this.accion.numero}`;
  }

  get descripcionModal(): string {
    return `Hallazgo ${this.data.hallazgo.indice} • Acción No. ${this.codigoAccion}`;
  }

  get etiquetaEstado(): string {
    if (this.accion.estadoId === ESTADO_ACCION.APROBADA) return 'Conforme';
    if (this.accion.estadoId === ESTADO_ACCION.RECHAZADA) return 'No conforme';
    return 'Pendiente dictamen';
  }

  get descripcionTipo(): string {
    return this.accion.tipoAccion === 'Correctiva' ? 'Elimina la causa raíz' : 'Previene la ocurrencia';
  }

  get responsablesLider(): string {
    return this.nombresResponsables(true);
  }

  get responsablesApoyo(): string {
    return this.nombresResponsables(false);
  }

  get longitudConcepto(): number {
    return this.form.get('observacion')?.value?.length ?? 0;
  }

  /** Como antes: no se registra de nuevo el mismo sentido que ya tiene la acción */
  opcionDeshabilitada(estadoId: number): boolean {
    return this.accion.estadoId === estadoId;
  }

  ngOnInit(): void {
    // Sin selección inicial: el sentido vigente de la acción no se puede volver a registrar
    this.form = this.fb.group({
      estadoId:    [null, Validators.required],
      observacion: ['', [Validators.required, Validators.maxLength(this.MAX_CONCEPTO)]],
    });

    this.cargarUltimoDictamen();
  }

  // Último concepto registrado (aprobación o rechazo) para mostrarlo como referencia
  private cargarUltimoDictamen(): void {
    if (!this.accion.accionId) return;
    this.planAuditoriaMid
      .get(`accion-mejora-estado?query=accion_mejora_id:${this.accion.accionId},estado_id__in:${ESTADO_ACCION.APROBADA}|${ESTADO_ACCION.RECHAZADA},activo:true&limit=1&sortby=fecha_ejecucion_estado&order=desc`)
      .subscribe({
        next: (res) => {
          const ultimo = res?.Data?.[0];
          this.ultimoDictamen = ultimo
            ? { observacion: ultimo.observacion ?? '', fecha: ultimo.fecha_ejecucion_estado }
            : null;
        },
        error: () => { this.ultimoDictamen = null; },
      });
  }

  private nombresResponsables(lider: boolean): string {
    const responsables = this.accion.responsables ?? [];
    if (!responsables.length) return lider ? this.accion.responsable : '';
    return responsables.filter(r => r.lider === lider).map(r => r.nombre).join(', ');
  }

  verHistorial(): void {
    this.dialog.open(ModalHistorialObservacionesAccionComponent, {
      width: '900px',
      data: { accionMejoraId: this.accion.accionId, accionPlanteada: this.accion.accionPlanteada },
    });
  }

  confirmar(): void {
    const observacion = this.form.get('observacion');
    if (observacion?.value && !observacion.value.trim()) {
      observacion.setErrors({ required: true });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { estadoId } = this.form.value;
    const conforme = estadoId === ESTADO_ACCION.APROBADA;
    this.alertService
      .showConfirmAlert(`¿Registrar el dictamen de la acción ${this.codigoAccion} como ${conforme ? 'conforme' : 'no conforme'}?`)
      .then(conf => {
        if (!conf.value) return;
        // El componente padre registra el estado correspondiente
        this.dialogRef.close({ estadoId, observacion: observacion!.value.trim() } as ResultadoDictamenAccion);
      });
  }
}
