import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivatedRoute } from '@angular/router';
import { AddAuditoriaModalComponent } from './add-auditoria-modal/add-auditoria-modal.component';
import { CargarArchivoComponent } from '../../cargar-archivo/cargar-archivo.component';
import { MatDialog } from '@angular/material/dialog';
import { ModalService } from 'src/app/services/modal.service';
import { PlanAnualAuditoriaService } from 'src/app/services/plan-anual-auditoria.service';
import { Auditoria } from 'src/app/data/models/plan-anual-auditoria/plan-anual-auditoria';
import { PdfVisualizadorComponent } from './pdf-visualizador-modal/pdf-visualizador.component';
@Component({
  selector: 'app-registrar-auditorias',
  templateUrl: './registrar-auditorias.component.html',
  styleUrls: ['./registrar-auditorias.component.css']
})

export class RegistrarAuditoriasComponent implements OnInit {

  displayedColumns: string[] = ['no', 'auditoria', 'tipoEvaluacion', 'cronograma', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Auditoria>([]);
  id: string = '';

  constructor(
    private modalService: ModalService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private planAnualAuditoriaService: PlanAnualAuditoriaService
  ) { }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '1';
    this.loadAuditoriasFromService();
  }

  loadAuditoriasFromService(): void {
    this.planAnualAuditoriaService.get(`/auditoria?query=plan_auditoria_id:${this.id}`).subscribe(
      (res) => {
        if (res && res.Data) {
          this.dataSource.data = res.Data
            .filter((item: any) => item.activo === true)
            .map((item: any) => ({
              id: item._id,
              auditoria: item.titulo ?? 'Sin Título',
              tipoEvaluacion: item.tipo_evaluacion_id ?? 'Sin Tipo',
              cronograma: item.cronograma_id ?? 'Sin Cronograma',
              estado: item.estado_id ?? 'Desconocido'
            }));
        }
      },
      (error) => {
        this.modalService.mostrarModal('Error al cargar las auditorías', 'error', 'ERROR');
      }
    );
  }


  // Función para manejar el evento de drag-and-drop
  drop(event: CdkDragDrop<Auditoria[]>): void {
    const prevData = [...this.dataSource.data];
    moveItemInArray(prevData, event.previousIndex, event.currentIndex);
    this.dataSource.data = prevData;
  }


  // Eliminar auditoría
  deleteAuditoria(element: Auditoria) {
    this.modalService
      .modalConfirmacion(' ', 'warning', '¿Está seguro(a) de eliminar el registro?')
      .then((result) => {
        if (result.isConfirmed) {
          console.log(element)
          this.planAnualAuditoriaService.delete(`/auditoria`, element).subscribe(
            (response) => {
              if (response) {
                this.modalService.mostrarModal('Registro eliminado', 'success', 'ÉXITO');
                this.dataSource.data = this.dataSource.data.filter(e => e.id !== element.id);
              } else {
                this.modalService.mostrarModal('Error al eliminar el registro', 'error', 'ERROR');
              }
            },
            (error) => {
              this.modalService.mostrarModal('Error al eliminar el registro', 'error', 'ERROR');
            }
          );
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

  subirArchivo(): void {
    const dialogRef = this.dialog.open(CargarArchivoComponent, {
      width: '600px',
    });
  }

  // Guardar cambios
  saveChanges(): void {
    console.log('Nuevo orden de auditorías:', this.dataSource.data);
  }

  addAuditoria(auditoria?: Auditoria) {
    // const nombreFormulario = 'sisifo_form2';
    // window.location.href = `http://localhost:4200/formularios-dinamicos/view-formulario/${nombreFormulario}`;
    const dialogRef = this.dialog.open(AddAuditoriaModalComponent, {
      width: '1200px',
      data: {
        planAuditoriaId: this.id,
        auditoria
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.saved) {
        console.log('Auditoría guardada o actualizada');
        this.loadAuditoriasFromService(); // Refrescar la lista después de guardar o actualizar.
      }
    });
  }
 
  // Editar auditoría
  editAuditoria(auditoria: Auditoria) {
    // const nombreFormulario = 'sisifo_form2';
    // window.location.href = `http://localhost:4200/formularios-dinamicos/editInfo-formulario/${nombreFormulario}/${index + 1}`;
    this.addAuditoria(auditoria);
  }
  renderizar() {
    this.planAnualAuditoriaService.planilla(`/plantilla/${this.id}`).subscribe(
      (res) => {
        if (res && res.Data) {
          console.log("DATA ",res.Data)
          this.dialog.open(PdfVisualizadorComponent, {
            data: { base64Document: res.Data }, 
            width: '80%',
            height: '80vh',
          });
        } else {
          this.modalService.mostrarModal('No se pudo cargar el PDF', 'warning', 'AVISO');
        }
      },
      (error) => {
        console.log("-----------",error)
        this.modalService.mostrarModal('Error al cargar el PDF', 'error', 'ERROR');
      }
    );
  }
}
