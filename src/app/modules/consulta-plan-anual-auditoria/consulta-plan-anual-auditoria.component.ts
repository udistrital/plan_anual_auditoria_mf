import { Component } from '@angular/core';

@Component({
  selector: 'app-consulta-plan-anual-auditoria',
  templateUrl: './consulta-plan-anual-auditoria.component.html',
  styleUrls: ['./consulta-plan-anual-auditoria.component.css']
})
export class ConsultaPlanAnualAuditoriaComponent {
  years = [2024, 2023, 2022];
  dataSource = [
    { no: 1, creadoPor: 'Pepito Pérez', vigencia: 2024, fechaCreacion: '31/01/2024', estado: 'Borrador' },
    { no: 2, creadoPor: 'Pepito Pérez', vigencia: 2023, fechaCreacion: '06/02/2023', estado: 'Cerrado' },
    { no: 3, creadoPor: 'Pepito Pérez', vigencia: 2022, fechaCreacion: '20/01/2022', estado: 'Cerrado' },
  ];
  displayedColumns: string[] = ['no', 'creadoPor', 'vigencia', 'fechaCreacion', 'estado', 'documentos', 'acciones'];

  editPAA(element: any) {
  }

  sendApproval(element: any) {
  }
}
