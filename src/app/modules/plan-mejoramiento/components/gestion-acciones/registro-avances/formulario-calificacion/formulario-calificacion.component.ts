import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  AYUDAS_CALIFICACION,
  CRITERIOS_EVALUACION,
  CriterioEvaluacion,
  MAX_CARACTERES_ANALISIS,
  criterioPorId,
  criterioSugerido,
} from '../registro-avances.utilidades';

export interface ValoresCalificacion {
  calificacion: number;
  criterio: number;
  observaciones: string;
}

/**
 * Formulario de calificación del auditor: porcentaje (campo + deslizador) que sugiere el criterio
 * por rango, criterio y análisis de seguimiento, con validación en línea y barra de acciones fija.
 * Solo valida y emite; la confirmación y el guardado los hace RegistroAvancesComponent.
 */
@Component({
  selector: 'app-formulario-calificacion',
  templateUrl: './formulario-calificacion.component.html',
  styleUrl: './formulario-calificacion.component.css',
  standalone: false,
})
export class FormularioCalificacionComponent implements AfterViewInit {
  /** Hay una calificación vigente: se puede cancelar y el mensaje advierte que la reemplaza. */
  @Input() hayVigente = false;
  @Input() guardando = false;
  @Output() calificar = new EventEmitter<ValoresCalificacion>();
  @Output() cancelar = new EventEmitter<void>();

  @ViewChild('campoPorcentaje') campoPorcentaje?: ElementRef<HTMLInputElement>;
  @ViewChild('campoAnalisis') campoAnalisis?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('grupoCriterios') grupoCriterios?: ElementRef<HTMLElement>;

  readonly criterios = CRITERIOS_EVALUACION;
  readonly ayudas = AYUDAS_CALIFICACION;
  readonly maxCaracteresAnalisis = MAX_CARACTERES_ANALISIS;

  formulario: FormGroup;
  intentoCalificar = false;
  /** El auditor eligió el criterio a mano: ya no se ajusta solo al cambiar el porcentaje. */
  criterioElegido = false;

  constructor(private readonly fb: FormBuilder) {
    this.formulario = this.fb.group({
      calificacion: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      criterio: [null, [Validators.required]],
      observaciones: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(MAX_CARACTERES_ANALISIS)]],
    });
  }

  ngAfterViewInit(): void {
    if (this.hayVigente) {
      setTimeout(() => this.campoPorcentaje?.nativeElement.focus());
    }
  }

  get porcentaje(): number | null {
    const valor = this.formulario.get('calificacion')?.value;
    return valor === null || valor === '' || valor === undefined ? null : Number(valor);
  }

  get criterioSeleccionado(): number | null {
    return this.formulario.get('criterio')?.value ?? null;
  }

  get criterioSugeridoActual(): CriterioEvaluacion | undefined {
    return criterioSugerido(this.porcentaje ?? Number.NaN);
  }

  /** Aviso cuando el criterio elegido no corresponde al rango del porcentaje. */
  get mensajeCoherencia(): string {
    const sugerido = this.criterioSugeridoActual;
    const elegido = criterioPorId(this.criterioSeleccionado);
    if (!sugerido || !elegido || sugerido.id === elegido.id) return '';
    return `El ${this.porcentaje}% corresponde a “${sugerido.nombre}”. Explique en el análisis por qué asigna “${elegido.nombre}”.`;
  }

  get longitudAnalisis(): number {
    return (this.formulario.get('observaciones')?.value ?? '').length;
  }

  campoInvalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return Boolean(control?.invalid && (control.touched || this.intentoCalificar));
  }

  cambiarPorcentaje(valor: string | number | null) {
    const numero = valor === '' || valor === null ? null : Math.round(Number(valor));
    const acotado = numero === null || Number.isNaN(numero) ? null : Math.max(0, Math.min(100, numero));
    this.formulario.patchValue({ calificacion: acotado });
    // [value] no reescribe el campo si el valor acotado no cambió (p. ej. de 100 a "1000"): se corrige a mano
    const campo = this.campoPorcentaje?.nativeElement;
    if (campo && acotado !== null && campo.value !== String(acotado)) {
      campo.value = String(acotado);
    }
    const sugerido = criterioSugerido(acotado ?? Number.NaN);
    if (sugerido && !this.criterioElegido) {
      this.formulario.patchValue({ criterio: sugerido.id });
    }
  }

  elegirCriterio(id: number) {
    this.criterioElegido = true;
    this.formulario.patchValue({ criterio: id });
    this.formulario.get('criterio')?.markAsTouched();
  }

  enviar() {
    this.intentoCalificar = true;
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      this.enfocarPrimerError();
      return;
    }
    const { calificacion, criterio, observaciones } = this.formulario.value;
    this.calificar.emit({
      calificacion: Number(calificacion),
      criterio: Number(criterio),
      observaciones: String(observaciones).trim(),
    });
  }

  private enfocarPrimerError() {
    if (this.campoInvalido('calificacion')) {
      this.campoPorcentaje?.nativeElement.focus();
    } else if (this.campoInvalido('criterio')) {
      this.grupoCriterios?.nativeElement.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
    } else if (this.campoInvalido('observaciones')) {
      this.campoAnalisis?.nativeElement.focus();
    }
  }
}
