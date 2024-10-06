import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-consulta-plan-anual-auditoria',
  templateUrl: './consulta-plan-anual-auditoria.component.html',
  styleUrls: ['./consulta-plan-anual-auditoria.component.css']
})
export class ConsultaPlanAnualAuditoriaComponent {
  years = [2024, 2023, 2022];
  dataSource = [
    { id: 1, creadoPor: 'Pepito Pérez', vigencia: 2024, fechaCreacion: '31/01/2024', estado: 'Borrador' },
    { id: 2, creadoPor: 'Pepito Pérez', vigencia: 2023, fechaCreacion: '06/02/2023', estado: 'Cerrado' },
    { id: 3, creadoPor: 'Pepito Pérez', vigencia: 2022, fechaCreacion: '20/01/2022', estado: 'Cerrado' },
  ];
  displayedColumns: string[] = ['no', 'creadoPor', 'vigencia', 'fechaCreacion', 'estado', 'documentos', 'acciones'];

  constructor(private router: Router) {}

  editReport(element: any) {
    const nombreFormulario = 'sisifo_form';
    window.location.href = `http://localhost:4200/formularios-dinamicos/editInfo-formulario/${nombreFormulario}/${element.id}`;
  }

  editActivities(element: any) {
    this.router.navigate([`/editar-actividades`, element.id]);  
  }

  sendApproval(element: any) {
    // Lógica para enviar aprobación
  }
}
