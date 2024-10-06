import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ModalService } from 'src/app/services/modal.service';
import { CargarArchivoComponent } from '../cargar-archivo/cargar-archivo.component';

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

  constructor(
    private router: Router,
    private modalService: ModalService,
    public dialog: MatDialog
  ) {}

  editReport(element: any) {
    const nombreFormulario = 'sisifo_form';
    window.location.href = `http://localhost:4200/formularios-dinamicos/editInfo-formulario/${nombreFormulario}/${element.id}`;
  }

  editActivities(element: any) {
    this.router.navigate([`/editar-actividades`, element.id]);  
  }

  sendApproval(element: any) {
    this.modalService
      .modalConfirmacion(
        ' ',
        'warning',
        '¿Está seguro(a) de enviar el Plan Anual de Auditoría - PAA?'
      )
      .then((result) => {
        if (result.isConfirmed) {
          console.log('Plan eliminado');

          this.modalService.mostrarModal(
            'Su plan fue enviado al jefe de oficina',
            'success',
            'PLAN ENVIADO'
          );
        }
      });
  }

  
  
}
