import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CriterioEvaluacion } from '../registro-avances.utilidades';

export interface CalificacionHistorial {
  porcentaje: number;
  criterio?: CriterioEvaluacion;
  observacion: string;
  fecha: Date;
  auditor: string;
  vigente: boolean;
}

/** Línea de tiempo de las calificaciones de la acción (la vigente primero). */
@Component({
  selector: 'app-panel-historial-calificaciones',
  templateUrl: './panel-historial-calificaciones.component.html',
  styleUrls: ['../panel-lateral.css', './panel-historial-calificaciones.component.css'],
  standalone: false,
})
export class PanelHistorialCalificacionesComponent {
  constructor(@Inject(MAT_DIALOG_DATA) readonly datos: { calificaciones: CalificacionHistorial[] }) {}
}
