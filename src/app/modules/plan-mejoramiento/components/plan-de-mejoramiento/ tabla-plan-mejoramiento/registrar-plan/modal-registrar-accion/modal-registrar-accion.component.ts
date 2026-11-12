import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { OikosService } from 'src/app/core/services/oikos.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { AccionPlan, ResultadoModalAccion } from '../tabla-hallazgos/tabla-hallazgos.component';
import { Auditoria } from 'src/app/shared/data/models/auditoria';
import { sumarDiasHabiles } from 'src/app/shared/utils/dias-habiles.util';

export interface DatosModalAccion {
  hallazgo: any;
  accion: AccionPlan | null;
  auditoria: Auditoria;
  planMejoramientoId: string;
  fechaAprobacionInforme: string | null;
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

  todasDependencias: Dependencia[] = [];
  /** Dependencias que pueden ser líderes: las de la auditoría (y, al editar, las que ya eran líderes) (#947) */
  candidatasLider: Dependencia[] = [];
  /** Ids de las dependencias marcadas como líder (al menos una) */
  lideres = new Set<number>();
  /** Respuesta a «¿Vincular dependencias de apoyo?»; el apoyo es opcional (#947) */
  vincularApoyo = false;

  dependenciasDisponibles: Dependencia[] = [];
  responsableSeleccionado: FormControl<Dependencia | null>;
  /** Dependencias de apoyo (dependencia_lider = false) */
  responsablesAgregados: Dependencia[] = [];

  /** Responsables guardados de la acción (solo en edición) */
  private responsablesActuales: { _id: string; dependencia_id: number; dependencia_lider: boolean }[] = [];

  cargandoDependencias = false;

  readonly maxCausa = 1000;

  tiposAccion = [
    { id: 1, nombre: 'Preventiva', descripcion: 'Previene la ocurrencia potencial' },
    { id: 2, nombre: 'Correctiva', descripcion: 'Elimina la causa del problema' },
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
  ) {
    // El apoyo es opcional (#947): el selector no lleva Validators.required (mostraba «*»)
    this.responsableSeleccionado = new FormControl<Dependencia | null>(null);
  }

  ngOnInit(): void {
    this.modoEdicion = !!this.data.accion;
    this.iniciarForm();
    this.cargarDependencias();
    if (this.modoEdicion) this.poblarForm();
  }

  private iniciarForm(): void {
    const { fechaInicio, fechaFin } = this.calcularFechas();
    // La causa la escribe la dependencia en cada acción (no sale del criterio de fase 3, #947)
    this.form = this.fb.group({
      causa:            ['', [Validators.required, Validators.maxLength(this.maxCausa)]],
      tipoAccion:       ['', Validators.required],
      accionPlanteada:  ['', Validators.required],
      nombreIndicador:  [''],
      formulaIndicador: [''],
      meta:             [''],
      fechaInicio:      [{ value: fechaInicio, disabled: true }],
      fechaFin:         [{ value: fechaFin,    disabled: true }],
    });
  }

  private calcularFechas(): { fechaInicio: Date | null; fechaFin: Date | null } {
    const iso = this.data.fechaAprobacionInforme;
    if (!iso) return { fechaInicio: null, fechaFin: null };
    const base = new Date(iso);
    if (isNaN(base.getTime())) return { fechaInicio: null, fechaFin: null };
    const fechaInicio = sumarDiasHabiles(base, 8);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + 180);
    return { fechaInicio, fechaFin };
  }

  // dependencia_id puede llegar como número o como arreglo
  private get idsDependenciasAuditoria(): number[] {
    const ids: any = this.data.auditoria?.dependencia_id;
    if (ids === null || ids === undefined) return [];
    return (Array.isArray(ids) ? ids : [ids]).map(Number);
  }

  private nombreDependencia(id: number): string {
    return this.todasDependencias.find(d => d.id === id)?.nombre ?? `Dependencia ${id}`;
  }

  /** Candidatas a líder: las dependencias de la auditoría más las que ya eran líderes al editar */
  private armarCandidatasLider(idsLideresGuardados: number[] = []): void {
    const ids = [...new Set([...this.idsDependenciasAuditoria, ...idsLideresGuardados])];
    this.candidatasLider = ids.map(id => ({ id, nombre: this.nombreDependencia(id) }));
  }

  private iniciarDependenciaLider(): void {
    if (this.modoEdicion) return;
    this.armarCandidatasLider();
    // Al crear el select inicia vacío; con una sola candidata, esa es la líder (#947)
    this.lideres = new Set(this.liderFijo ? [this.candidatasLider[0].id] : []);
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
        this.iniciarDependenciaLider();
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
          const idsLideres = this.responsablesActuales.filter(r => r.dependencia_lider).map(r => r.dependencia_id);
          this.armarCandidatasLider(idsLideres);
          // Acción antigua sin líder: con una sola candidata se preselecciona (el select queda deshabilitado)
          this.lideres = new Set(!idsLideres.length && this.liderFijo ? [this.candidatasLider[0].id] : idsLideres);
          // Si aún falta la líder, el aviso se muestra sin esperar a que toquen el select
          this.lideresTocados = this.lideres.size === 0;
          // El apoyo son los responsables que no son líderes
          this.responsablesAgregados = this.responsablesActuales
            .filter(r => !r.dependencia_lider)
            .map(r => ({ id: r.dependencia_id, nombre: this.nombreDependencia(r.dependencia_id) }));
          this.vincularApoyo = this.responsablesAgregados.length > 0;
          this.actualizarDisponibles();
        },
        // Sin los responsables guardados se ofrecen las de la auditoría para elegir de nuevo
        error: () => { this.armarCandidatasLider(); }
      });
  }

  private poblarForm(): void {
    const a = this.data.accion!;
    const fechaInicio = a.fechaInicioISO ? new Date(a.fechaInicioISO) : this.form.getRawValue().fechaInicio;
    const fechaFin    = a.fechaFinISO    ? new Date(a.fechaFinISO)    : this.form.getRawValue().fechaFin;
    this.form.patchValue({
      causa:            a.causa ?? '',
      tipoAccion:       a.tipoAccionId ?? '',
      accionPlanteada:  a.accionPlanteada,
      nombreIndicador:  a.nombreIndicador,
      formulaIndicador: a.formulaIndicador,
      meta:             a.meta,
      fechaInicio,
      fechaFin,
    });
  }

  get titulo(): string {
    return `${this.modoEdicion ? 'Editar acción del' : 'Añadir acción al'} hallazgo No. ${this.data.hallazgo?.indice ?? ''}`;
  }

  get descripcionModal(): string {
    const vigencia = this.data.auditoria?.vigencia_nombre;
    return `Formulación del plan de mejoramiento${vigencia ? ' • Vigencia ' + vigencia : ''}`;
  }

  longitud(campo: string): number {
    return this.form.get(campo)?.value?.length ?? 0;
  }

  /** Duración entre las fechas calculadas de la acción */
  get duracionEstimada(): string {
    const { fechaInicio, fechaFin } = this.form.getRawValue();
    if (!fechaInicio || !fechaFin) return '';
    const dias = Math.round((new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / 86400000);
    if (isNaN(dias) || dias < 0) return '';
    const meses = Math.round(dias / 30);
    return `${meses} mes(es) (${dias} días)`;
  }

  /** Obligatorios del formulario completos y al menos una dependencia líder (el apoyo es opcional, #947) */
  get formularioCompleto(): boolean {
    return this.form.valid && this.lideres.size > 0;
  }

  /** Con una sola candidata, esa es la líder y no se puede desmarcar */
  get liderFijo(): boolean {
    return this.candidatasLider.length === 1;
  }

  /** Ids seleccionados en el select múltiple de líderes */
  get idsLideres(): number[] {
    return [...this.lideres];
  }

  /** El aviso de «al menos una líder» se muestra después de tocar el select */
  lideresTocados = false;

  /** Lo seleccionado en el select son las líderes (#947) */
  cambiarLideres(ids: number[]): void {
    this.lideres = new Set(ids);
    this.lideresTocados = true;
    // Una dependencia no puede ser líder y apoyo a la vez
    this.responsablesAgregados = this.responsablesAgregados.filter(r => !this.lideres.has(r.id));
    this.actualizarDisponibles();
  }

  cambiarVincularApoyo(vincular: boolean): void {
    this.vincularApoyo = vincular;
    if (!vincular) {
      // «No» quita las de apoyo agregadas (al editar, se eliminan al guardar)
      this.responsablesAgregados = [];
      this.responsableSeleccionado.patchValue(null);
      this.actualizarDisponibles();
    }
  }

  private actualizarDisponibles(): void {
    const ocupadas = new Set([...this.responsablesAgregados.map(r => r.id), ...this.lideres]);
    this.dependenciasDisponibles = this.todasDependencias.filter(d => !ocupadas.has(d.id));
  }

  agregarResponsable(): void {
    if (!this.responsableSeleccionado.value) return;
    const seleccionado = this.responsableSeleccionado.value!;
    this.responsablesAgregados = [...this.responsablesAgregados, { ...seleccionado }];
    this.responsableSeleccionado.patchValue(null);
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

    if (this.lideres.size === 0) {
      this.alertService.showAlert('Sin dependencia líder', 'Seleccione al menos una dependencia líder de la acción.');
      return;
    }

    this.alertService.showConfirmAlert('¿Guardar cambios?').then(conf => {
      if (!conf.value) return;

      const v = this.form.getRawValue();
      const { responsablesNuevos, responsablesAEliminar, responsablesActualizar } = this.calcularCambiosResponsables();

      const resultado: ResultadoModalAccion = {
        accion: {
          accionId:         this.data.accion?.accionId,
          causa:            (v.causa ?? '').trim(),
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
        responsablesActualizar,
      };

      this.dialogRef.close(resultado);
    });
  }

  /**
   * Compara lo elegido (líderes + apoyo) con lo guardado: nuevos (POST), quitados (DELETE) y los que
   * siguen pero cambian de rol líder/apoyo (PUT dependencia_lider). Al crear, todo es nuevo.
   */
  private calcularCambiosResponsables(): Pick<ResultadoModalAccion, 'responsablesNuevos' | 'responsablesAEliminar' | 'responsablesActualizar'> {
    const elegidos = new Map<number, boolean>();
    this.lideres.forEach(id => elegidos.set(id, true));
    this.responsablesAgregados.forEach(r => { if (!elegidos.has(r.id)) elegidos.set(r.id, false); });

    const guardados = new Map(this.responsablesActuales.map(r => [r.dependencia_id, r]));
    const responsablesNuevos: ResultadoModalAccion['responsablesNuevos'] = [];
    const responsablesActualizar: ResultadoModalAccion['responsablesActualizar'] = [];
    elegidos.forEach((lider, dependenciaId) => {
      const guardado = guardados.get(dependenciaId);
      if (!guardado) {
        responsablesNuevos.push({ dependencia_id: dependenciaId, dependencia_lider: lider });
      } else if (!!guardado.dependencia_lider !== lider) {
        responsablesActualizar.push({ _id: guardado._id, dependencia_lider: lider });
      }
    });
    const responsablesAEliminar = this.responsablesActuales
      .filter(r => !elegidos.has(r.dependencia_id))
      .map(r => r._id);

    return { responsablesNuevos, responsablesAEliminar, responsablesActualizar };
  }
}
