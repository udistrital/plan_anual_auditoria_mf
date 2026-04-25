import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/services/alert.service';
import { AccionPlan } from '../tabla-hallazgos/tabla-hallazgos.component';

export interface DatosModalAccion {
  hallazgo: any;
  accion: AccionPlan | null;
  auditoria: any;
}

export interface Dependencia {
  id: string;
  nombre: string;
}

@Component({
  selector: 'app-modal-registrar-accion',
  templateUrl: './modal-registrar-accion.component.html',
  styleUrls: ['./modal-registrar-accion.component.css'],
})
export class ModalRegistrarAccionComponent implements OnInit {
  form!: FormGroup;
  modoEdicion = false;
  /** Nombre de la dependencia líder (read-only, viene de la auditoría) */
  dependenciaLider = '';

  /** Lista de dependencias disponibles para seleccionar (mock para pruebas) */
  dependenciasDisponibles: Dependencia[] = [
    { id: '1', nombre: 'Oficina de Control Interno' },
    { id: '2', nombre: 'Gestión de Docencia' },
    { id: '3', nombre: 'Gestión de Bienestar' },
    { id: '4', nombre: 'Gestión Financiera' },
    { id: '5', nombre: 'Gestión de TI' },
  ];

  /** Dependencia actualmente seleccionada en el dropdown */
  responsableSeleccionado: Dependencia | null = null;

  /** Responsables ya agregados (se muestran como chips) */
  responsablesAgregados: Dependencia[] = [];
  tiposAccion = [
    { id: 1, nombre: 'Preventiva' },
    { id: 2, nombre: 'Correctiva' },
  ];

  readonly tooltips = {
    causa:
      'Motivo por el cual se presentó el hallazgo determinado en el ejercicio de Auditoría. Se debe realizar una descripción precisa intentando transcribir el enunciado del hallazgo. Se sugiere el uso de herramientas que permitan realizar un análisis de causa raíz.',
    accionPreventiva:
      'Mecanismo utilizado por las entidades para evitar las causas de una situación no deseable que puede llegar a afectar el normal cumplimiento del quehacer institucional (Fuente: Función Pública).',
    accionCorrectiva:
      'Mecanismo utilizado por las entidades para eliminar las causas de una situación no deseable que afectó el normal cumplimiento del quehacer institucional. Acción usada como respuesta a un ejercicio de Auditoría (Fuente: Función Pública).',
    accionPlanteada:
      'Actividad que realizará la(s) dependencia(s) responsable(s), con el objetivo de subsanar la causa raíz de la situación descrita en el informe final de Auditoría o documento equivalente. Debe iniciar con un verbo en infinitivo.',
    formulaIndicador:
      'Representación cuantitativa que debe ser expresada en variable o relación entre variables, que permitan medir el cumplimiento de la acción determinada y así realizar una evaluación objetiva.',
    nombreIndicador:
      'Instrumento de medida que permite analizar la relación entre dos o más variables con el fin de determinar el avance o retroceso en el logro de un objetivo en un período determinado (Fuente: Función Pública).',
    meta:
      'Representa el porcentaje de cumplimiento determinado para la actividad. Debe expresarse de forma cuantificable y que esté directamente relacionada con la acción planteada.',
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DatosModalAccion,
    private readonly dialogRef: MatDialogRef<ModalRegistrarAccionComponent>,
    private readonly fb: FormBuilder,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.modoEdicion = !!this.data.accion;
    this.iniciarForm();
    this.iniciarResponsables();
    if (this.modoEdicion) this.poblarForm();
  }

  private iniciarForm(): void {
    this.form = this.fb.group({
      causa:            ['', Validators.required],
      tipoAccion:       ['', Validators.required],
      accionPlanteada:  ['', Validators.required],
      nombreIndicador:  [''],
      formulaIndicador: [''],
      meta:             [''],
    });
  }

  private iniciarResponsables(): void {
    // Dependencia líder viene de la auditoría (read-only)
    this.dependenciaLider =
      this.data.auditoria?.jefe_nombre ??
      this.data.auditoria?.dependencia_nombre ??
      '';
  }

  private poblarForm(): void {
    const a = this.data.accion!;
    this.form.patchValue({
      causa:            a.tipoAccion,
      tipoAccion:       a.tipoAccion,
      accionPlanteada:  a.accionPlanteada,
      nombreIndicador:  a.nombreIndicador,
      formulaIndicador: a.formulaIndicador,
      meta:             a.meta,
    });

    // Restaurar responsables guardados en la acción
    if (a.responsable) {
      this.responsablesAgregados = [{ id: '0', nombre: a.responsable }];
    }
  }

  agregarResponsable(): void {
    if (!this.responsableSeleccionado) return;

    const yaExiste = this.responsablesAgregados.some(
      r => r.id === this.responsableSeleccionado!.id
    );
    if (yaExiste) {
      this.alertService.showAlert(
        'Responsable duplicado',
        'Esta dependencia ya fue agregada como responsable.'
      );
      return;
    }

    this.responsablesAgregados = [...this.responsablesAgregados, { ...this.responsableSeleccionado }];
    this.dependenciasDisponibles = this.dependenciasDisponibles.filter(
      d => d.id !== this.responsableSeleccionado!.id
    );
    this.responsableSeleccionado = null;
  }

  eliminarResponsable(index: number): void {
    const eliminado = this.responsablesAgregados[index];
    // Devolver al dropdown
    this.dependenciasDisponibles = [...this.dependenciasDisponibles, eliminado];
    this.responsablesAgregados = this.responsablesAgregados.filter((_, i) => i !== index);
  }

  guardarYCerrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.alertService.showErrorAlert('Complete todos los campos obligatorios.');
      return;
    }

    if (this.responsablesAgregados.length === 0) {
      this.alertService.showAlert(
        'Sin responsables',
        'Debe agregar al menos un responsable de la acción.'
      );
      return;
    }

    this.alertService
      .showConfirmAlert('¿Guardar cambios?')
      .then((confirmado) => {
        if (!confirmado.value) return;

        const v = this.form.value;

        const accionGuardada: AccionPlan = {
          numero:           this.data.accion?.numero ?? '',
          tipoAccion:       this.tiposAccion.find(t => t.id === v.tipoAccion)?.nombre ?? v.tipoAccion,
          accionPlanteada:  v.accionPlanteada,
          nombreIndicador:  v.nombreIndicador,
          formulaIndicador: v.formulaIndicador,
          meta:             v.meta,
          // Concatenar nombres de responsables si hay varios
          responsable:      this.responsablesAgregados.map(r => r.nombre).join(', '),
          fechaInicio:      '',
          fechaFin:         '',
        };

        this.alertService.showSuccessAlert('Acción guardada correctamente.', 'Guardado');
        this.dialogRef.close(accionGuardada);
      });
  }
}