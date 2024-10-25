import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';  // Para los botones
import { MatStepperModule } from '@angular/material/stepper';  // Importa MatStepperModule para <mat-step> y <mat-vertical-stepper>
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ViewEncapsulation } from '@angular/core';




@Component({
  selector: 'app-plan-anual-auditoria',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule, 
    MatButtonModule,
    MatStepperModule,
    MatIconModule,
    MatGridListModule,
    MatListModule,
    PdfViewerModule,
  ],
  templateUrl: './plan-anual-auditoria.component.html',
  styleUrls: ['./plan-anual-auditoria.component.css'],
  encapsulation: ViewEncapsulation.None

})
export class PlanAnualAuditoriaComponent {
documento: any;
botonSeleccionado: string = '';

seleccionarBoton(boton: string): void {
  this.botonSeleccionado = boton;
}
}


