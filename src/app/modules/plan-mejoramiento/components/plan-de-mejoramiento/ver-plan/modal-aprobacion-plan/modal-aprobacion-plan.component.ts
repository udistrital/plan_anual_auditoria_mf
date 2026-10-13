import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DatosModalAprobacionPlan {
  expediente?: string;
  totalAcciones: number;
  totalHallazgos: number;
}

/** Confirmación de la aprobación del plan de mejoramiento; devuelve true al confirmar */
@Component({
  selector: 'app-modal-aprobacion-plan',
  templateUrl: './modal-aprobacion-plan.component.html',
  styleUrls: ['./modal-aprobacion-plan.component.css'],
  standalone: false,
})
export class ModalAprobacionPlanComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DatosModalAprobacionPlan) {}
}
