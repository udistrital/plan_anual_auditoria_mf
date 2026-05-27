import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { OikosService } from 'src/app/core/services/oikos.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { AccionPlan, ResultadoModalAccion } from '../tabla-hallazgos/tabla-hallazgos.component';

export interface DatosModalAccion {
  hallazgo: any;
  accion: AccionPlan | null;
  auditoria: any;
  planMejoramientoId: string;
}

export interface Dependencia {
  id: number;
  nombre: string;
}

@Component({
    selector: 'app-modal-registrar-accion',
    templateUrl: './modal-registrar-accion.component.html',
    styleUrls: ['./modal-registrar-accion.component.css'],
    standalone: false
})
export class ModalRegistrarAccionComponent implements OnInit {
  form!: FormGroup;
  modoEdicion = false;
  dependenciaLider = '';

  todasDependencias: Dependencia[] = [];
  dependenciasDisponibles: Dependencia[] = [];
  responsableSeleccionado: Dependencia | null = null;
  responsablesAgregados: Dependencia[] = [];

  private responsablesActuales: { _id: string; dependencia_id: number; dependencia_lider: boolean }[] = [];

  cargandoDependencias = false;
  fechaMinFin: Date | null = null;

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
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly oikosService: OikosService,
  ) {}

  ngOnInit(): void {
    this.modoEdicion = !!this.data.accion;
    this.iniciarForm();
    this.iniciarDependenciaLider();
    this.cargarDependencias();
    if (this.modoEdicion) this.poblarForm();
  }

  private iniciarForm(): void {
    this.form = this.fb.group({
      causa:            [this.data.hallazgo?.causa ?? '', Validators.required],
      tipoAccion:       ['', Validators.required],
      accionPlanteada:  ['', Validators.required],
      nombreIndicador:  [''],
      formulaIndicador: [''],
      meta:             [''],
      fechaInicio:      [null, Validators.required],
      fechaFin:         [{ value: null, disabled: true }, Validators.required],
    });

    this.form.get('fechaInicio')!.valueChanges.subscribe((fecha) => {
      const controlFin = this.form.get('fechaFin')!;
      if (fecha) {
        controlFin.enable();
        this.fechaMinFin = fecha;
        if (controlFin.value && controlFin.value < fecha) {
          controlFin.setValue(null);
        }
      } else {
        controlFin.disable();
        controlFin.setValue(null);
        this.fechaMinFin = null;
      }
    });
  }

  private iniciarDependenciaLider(): void {
    this.dependenciaLider =
      this.data.auditoria?.jefe_nombre ??
      this.data.auditoria?.dependencia_nombre ??
      '';
  }

  private cargarDependencias(): void {
    this.cargandoDependencias = true;
    this.oikosService.get('dependencia?limit=0&query=Activo:true').subscribe({
      next: (res: any) => {
        const lista: any[] = Array.isArray(res) ? res : (res.Data ?? []);
        this.todasDependencias = lista.map((d: any) => ({
          id:     d.Id ?? d.id,
          nombre: d.Nombre ?? d.nombre,
        }));
        this.actualizarDisponibles();
        this.cargandoDependencias = false;

        if (this.modoEdicion) this.cargarResponsablesExistentes();
      },
      error: () => { this.cargandoDependencias = false; }
    });
  }

  private cargarResponsablesExistentes(): void {
    const accionId = this.data.accion?.accionId;
    if (!accionId) return;

    this.planAuditoriaService
      .get(`responsable-accion?query=accion_mejora_id:${accionId},activo:true`)
      .subscribe({
        next: (res) => {
          this.responsablesActuales = res.Data ?? [];
          // Mostrar en UI solo los que NO son líderes
          const dependenciasActuales = this.responsablesActuales.filter(r => !r.dependencia_lider);
          this.responsablesAgregados = dependenciasActuales.map(r => {
            const dep = this.todasDependencias.find(d => d.id === r.dependencia_id);
            return { id: r.dependencia_id, nombre: dep?.nombre ?? `Dependencia ${r.dependencia_id}` };
          });
          this.actualizarDisponibles();
        },
        error: () => {}
      });
  }

  private poblarForm(): void {
    const a = this.data.accion!;
    const fechaInicio = a.fechaInicioISO ? new Date(a.fechaInicioISO) : null;
    if (fechaInicio && !isNaN(fechaInicio.getTime())) {
      this.fechaMinFin = fechaInicio;
      this.form.get('fechaFin')!.enable();
    }
    this.form.patchValue({
      causa:            this.data.hallazgo?.causa ?? '',
      tipoAccion:       a.tipoAccionId ?? '',
      accionPlanteada:  a.accionPlanteada,
      nombreIndicador:  a.nombreIndicador,
      formulaIndicador: a.formulaIndicador,
      meta:             a.meta,
      fechaInicio,
      fechaFin:         a.fechaFinISO ? new Date(a.fechaFinISO) : null,
    });
  }

  private actualizarDisponibles(): void {
    const idsAgregados = new Set(this.responsablesAgregados.map(r => r.id));
    this.dependenciasDisponibles = this.todasDependencias.filter(d => !idsAgregados.has(d.id));
  }

  agregarResponsable(): void {
    if (!this.responsableSeleccionado) return;
    this.responsablesAgregados = [...this.responsablesAgregados, { ...this.responsableSeleccionado }];
    this.responsableSeleccionado = null;
    this.actualizarDisponibles();
  }

  eliminarResponsable(index: number): void {
    this.responsablesAgregados = this.responsablesAgregados.filter((_, i) => i !== index);
    this.actualizarDisponibles();
  }

  guardarYCerrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.alertService.showErrorAlert('Complete todos los campos obligatorios.');
      return;
    }

    if (this.responsablesAgregados.length === 0) {
      this.alertService.showAlert('Sin responsables', 'Debe agregar al menos un responsable de la acción.');
      return;
    }

    this.alertService.showConfirmAlert('¿Guardar cambios?').then(conf => {
      if (!conf.value) return;

      const v = this.form.getRawValue();
      const liderDependenciaId: number = this.data.auditoria?.dependencia_id ?? 0;

      // IDs de dependencias (no-lider) que ya estaban en DB
      const idsActualesNoLider = new Set(
        this.responsablesActuales
          .filter(r => !r.dependencia_lider)
          .map(r => r.dependencia_id)
      );
      const idsEnUI = new Set(this.responsablesAgregados.map(r => r.id));

      // Registros a eliminar: estaban en DB pero el usuario los quitó
      const responsablesAEliminar = this.responsablesActuales
        .filter(r => !r.dependencia_lider && !idsEnUI.has(r.dependencia_id))
        .map(r => r._id);

      const responsablesNuevos: { dependencia_id: number; dependencia_lider: boolean }[] = [];

      // En creación: incluir la dependencia líder solo si tiene ID válido
      if (!this.modoEdicion && liderDependenciaId) {
        responsablesNuevos.push({ dependencia_id: liderDependenciaId, dependencia_lider: true });
      }

      // Dependencias que el usuario agregó y no estaban en DB
      this.responsablesAgregados.forEach(r => {
        if (!idsActualesNoLider.has(r.id)) {
          responsablesNuevos.push({ dependencia_id: r.id, dependencia_lider: false });
        }
      });

      const resultado: ResultadoModalAccion = {
        accion: {
          accionId:         this.data.accion?.accionId,
          tipoAccionId:     v.tipoAccion,
          accionPlanteada:  v.accionPlanteada,
          nombreIndicador:  v.nombreIndicador,
          formulaIndicador: v.formulaIndicador,
          meta:             v.meta,
          fechaInicio:      v.fechaInicio ? (v.fechaInicio as Date).toISOString() : null,
          fechaFin:         v.fechaFin ? (v.fechaFin as Date).toISOString() : null,
        },
        responsablesNuevos,
        responsablesAEliminar,
      };

      this.alertService.showSuccessAlert('Acción guardada correctamente.', 'Guardado');
      this.dialogRef.close(resultado);
    });
  }
}
