import { Component, ElementRef, Inject, QueryList, ViewChildren } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export type PestanaFicha = 'accion' | 'hallazgo' | 'auditoria' | 'responsables';

export interface DatosFichaAccion {
  pestana: PestanaFicha;
  accion: {
    noAccion?: string;
    tipo?: string;
    descripcion?: string;
    nombreIndicador?: string;
    formulaIndicador?: string;
    meta?: string;
    fechaInicio?: string | Date;
    fechaFin?: string | Date;
  };
  hallazgo: {
    numero?: string;
    descripcion?: string;
    causa?: string;
  };
  auditoria: {
    numero?: number;
    nombre?: string;
    tipoEvaluacion?: string;
    vigencia?: string;
  };
  dependenciasLideres: any[];
  dependenciasApoyo: any[];
  auditores: any[];
}

/** Ficha de consulta de la acción: reemplaza los desplegables de auditoría y acción de la vista. */
@Component({
  selector: 'app-panel-ficha-accion',
  templateUrl: './panel-ficha-accion.component.html',
  styleUrls: ['../panel-lateral.css', './panel-ficha-accion.component.css'],
  standalone: false,
})
export class PanelFichaAccionComponent {
  @ViewChildren('pestanaBoton') pestanasBotones!: QueryList<ElementRef<HTMLButtonElement>>;

  readonly pestanas: { id: PestanaFicha; nombre: string }[] = [
    { id: 'accion', nombre: 'Acción' },
    { id: 'hallazgo', nombre: 'Hallazgo' },
    { id: 'auditoria', nombre: 'Auditoría' },
    { id: 'responsables', nombre: 'Responsables' },
  ];

  pestanaActiva: PestanaFicha;

  constructor(@Inject(MAT_DIALOG_DATA) readonly datos: DatosFichaAccion) {
    this.pestanaActiva = datos.pestana ?? 'accion';
  }

  iniciales(nombre: string | null | undefined): string {
    return (nombre ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p.charAt(0).toUpperCase())
      .join('');
  }

  /** Flechas izquierda/derecha cambian de pestaña (patrón de pestañas WAI-ARIA). */
  moverPestana(evento: KeyboardEvent, indice: number) {
    const direccion = evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0;
    if (!direccion) return;
    evento.preventDefault();
    const siguiente = (indice + direccion + this.pestanas.length) % this.pestanas.length;
    this.pestanaActiva = this.pestanas[siguiente].id;
    this.pestanasBotones.get(siguiente)?.nativeElement.focus();
  }
}
