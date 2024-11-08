import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ModalService } from 'src/app/services/modal.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { PlanAnualAuditoriaService } from 'src/app/services/plan-anual-auditoria.service';
import { MatTableDataSource } from '@angular/material/table';
import { Parametro } from 'src/app/data/models/parametros/parametros';
import { Plan } from 'src/app/data/models/plan-anual-auditoria/plan-anual-auditoria';

@Component({
  selector: 'app-consulta-plan-anual-auditoria',
  templateUrl: './consulta-plan-anual-auditoria.component.html',
  styleUrls: ['./consulta-plan-anual-auditoria.component.css']
})
export class ConsultaPlanAnualAuditoriaComponent implements OnInit {
  years: Parametro[] = [];
  selectedYearId: number | null = null;

  dataSource = new MatTableDataSource<Plan>([]);
  displayedColumns: string[] = ['no', 'creadoPor', 'vigencia', 'fechaCreacion', 'estado', 'documentos', 'acciones'];

  constructor(
    private router: Router,
    private modalService: ModalService,
    public dialog: MatDialog,
    private parametrosService: ParametrosService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService
  ) {}

  ngOnInit(): void {
    this.CargarEvaluaciones();
    this.cargarPlanesAuditoria();
  }

  CargarEvaluaciones() {
    this.parametrosService.get('parametro?query=TipoParametroId:121&limit=0').subscribe((res) => {
      if (res !== null) {
        this.years = res.Data;
      }
    });
  }

  cargarPlanesAuditoria() {
    this.planAnualAuditoriaService.get('/plan-auditoria').subscribe(
      (res) => {
        if (res && res.Data) {
          
          this.dataSource.data = res.Data
            .filter((item: any) => item.activo === true) 
            .map((item: any, index: number) => ({
              id: item._id,
              creadoPor: item.creadoPor ?? 'Sin asignar',
              vigencia: item.vigenciaId,
              fechaCreacion: item.fechaCreacion,
              estado: item.estado ?? 'Desconocido'
            }));
        }
      },
      (error) => {
        this.modalService.mostrarModal('Error al cargar los planes de auditoría', 'error', 'ERROR');
      }
    );
  }

  crearPlan() {
    if (this.selectedYearId) {
      const Plan: any = {
        vigenciaId: this.selectedYearId,
      };
  
      this.planAnualAuditoriaService.post('/plan-auditoria', Plan)
        .subscribe(
          (response: any) => {
            if (response.Status === 201) {
              this.modalService.mostrarModal('Plan creado exitosamente', 'success', 'PLAN CREADO');
              this.cargarPlanesAuditoria();
            }
          },
          (error) => {
            // Verificar si el error es por duplicidad de vigenciaId
            if (error.error?.Data && error.error.Data.includes('Ya existe un plan de auditoría para la vigencia')) {
              this.modalService.mostrarModal(
                'Ya existe un plan de auditoría para la vigencia seleccionada.',
                'warning',
                'VIGENCIA DUPLICADA'
              );
            } else {
              this.modalService.mostrarModal('Error al crear el plan', 'error', 'ERROR');
            }
          }
        );
    } else {
      this.modalService.mostrarModal('Debe seleccionar un año', 'warning', 'SELECCIÓN REQUERIDA');
    }
  }

  editReport(element: any) {
    console.log(this.dataSource);
    this.router.navigate([`registrar-plan/`, element.id]);
  }

  editActivities(element: any) { 
    this.router.navigate([`registrar-auditorias`, element.id]);  
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
          console.log('Plan enviado');
          this.modalService.mostrarModal(
            'Su plan fue enviado al jefe de oficina',
            'success',
            'PLAN ENVIADO'
          );
        }
      });
  }
}
