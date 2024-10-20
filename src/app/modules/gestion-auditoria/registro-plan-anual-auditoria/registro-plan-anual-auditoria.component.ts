import { ModalService } from './../../../services/modal.service';
import { Component, OnInit } from '@angular/core';
import {FormBuilder, Validators, FormGroup, ValidationErrors, AbstractControl} from '@angular/forms';
import { CargarArchivoComponent } from '../../cargar-archivo/cargar-archivo.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-registro-plan-anual-auditoria',
  templateUrl: './registro-plan-anual-auditoria.component.html',
  styleUrls: ['./registro-plan-anual-auditoria.component.css'],
})
export class RegistroPlanAnualAuditoriaComponent implements OnInit {
  datos = [
    {
      no: 1,
      auditoria: 'titulo',
      tipoEvaluacion: 'Auditoria Interna',
      cronogramaActividades: 'Mes',
      estado: 'Sin Iniciar',
    },
    {
      no: 2,
      auditoria: 'titulo',
      tipoEvaluacion: 'seguimiento',
      cronogramaActividades: 'Mes',
      estado: 'Sin Iniciar',
    },
    {
      no: 4,
      auditoria: 'titulo',
      tipoEvaluacion: 'seguimiento',
      cronogramaActividades: 'Mes',
      estado: 'Sin Iniciar',
    },
    {
      no: 5,
      auditoria: 'titulo',
      tipoEvaluacion: 'seguimiento',
      cronogramaActividades: 'Mes',
      estado: 'Sin Iniciar',
    },
    {
      no: 6,
      auditoria: 'titulo',
      tipoEvaluacion: 'informe',
      cronogramaActividades: 'Mes',
      estado: 'Sin Iniciar',
    },
  ];
  columnsToDisplay: string[] = [
    'no',
    'auditoria',
    'tipoEvaluacion',
    'cronogramaActividades',
    'estado',
    'acciones',
  ];

  constructor(
    private modalService: ModalService,
    public dialog: MatDialog) {}
  resetComponent() {}
  onStepLeave() {
    this.resetComponent();
  }
  ngOnInit(): void {}

  EliminarAuditoria() {
    this.modalService
      .modalConfirmacion(
        ' ',
        'warning',
        '¿Está seguro(a) de eliminar el registro?'
      )
      .then((result) => {
        if (result.isConfirmed) {
          console.log('Registro eliminado');

          this.modalService.mostrarModal(' ', 'error', 'Registro eliminado');
        }
      });
  }

  GuardarPaa() {
    this.modalService
      .modalConfirmacion(
        ' ',
        'warning',
        '¿Está seguro(a) de guardar el Plan Anual de Auditoría - PAA?'
      )
      .then((result) => {
        if (result.isConfirmed) {
          console.log('Plan eliminado');

          this.modalService.mostrarModal(
            'Su plan fue guardado exitosamente',
            'success',
            'PLAN GUARDADO'
          );
        }
      });
  }

  subirArchivo(tipoArchivo: string): void {
    const dialogRef = this.dialog.open(CargarArchivoComponent, {
      width: '600px',
      data: {tipoArchivo}
    });
  }
}