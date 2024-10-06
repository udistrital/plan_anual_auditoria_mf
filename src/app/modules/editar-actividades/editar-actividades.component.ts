import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivatedRoute } from '@angular/router'; 


interface Auditoria {
  auditoria: string;
  tipoEvaluacion: string;
  cronograma: string;
  estado: string;
}

@Component({
  selector: 'app-editar-actividades',
  templateUrl: './editar-actividades.component.html',
  styleUrls: ['./editar-actividades.component.css']
})
export class EditarActividadesComponent implements OnInit {
  displayedColumns: string[] = ['no', 'auditoria', 'tipoEvaluacion', 'cronograma', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Auditoria>([]);
  id: string;

  // Mock de datos basado en diferentes IDs
  auditoriasMock: { [key: string]: Auditoria[] } = {
    '1': [
      { auditoria: 'Auditoría 1', tipoEvaluacion: 'Auditoría Interna', cronograma: 'Mes', estado: 'Sin Iniciar' },
      { auditoria: 'Auditoría 2', tipoEvaluacion: 'Seguimiento', cronograma: 'Mes', estado: 'Sin Iniciar' },
      { auditoria: 'Auditoría 3', tipoEvaluacion: 'Auditoría Externa', cronograma: 'Trimestre', estado: 'En Proceso' }
    ],
    '2': [
      { auditoria: 'Auditoría 4', tipoEvaluacion: 'Revisión', cronograma: 'Mes', estado: 'Completada' }
    ],
    '3': [
      { auditoria: 'Auditoría 5', tipoEvaluacion: 'Auditoría Interna', cronograma: 'Anual', estado: 'En Proceso' },
      { auditoria: 'Auditoría 6', tipoEvaluacion: 'Seguimiento', cronograma: 'Semestre', estado: 'Sin Iniciar' }
    ]
  };

  constructor(private route: ActivatedRoute) {
    this.id = '';
  } 

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '1'; 
    this.loadAuditorias(this.id);  
  }

  // Cargar los datos de auditorías según el ID
  loadAuditorias(id: string): void {
    this.dataSource.data = this.auditoriasMock[id] || [];  
  }

  // Función para manejar el evento de drag-and-drop
  drop(event: CdkDragDrop<Auditoria[]>): void {
    const prevData = [...this.dataSource.data];
    moveItemInArray(prevData, event.previousIndex, event.currentIndex);
    this.dataSource.data = prevData;  
  }

  // Editar auditoría
  editAuditoria(index: number) {
    const nombreFormulario = 'sisifo_form2';
    window.location.href = `http://localhost:4200/formularios-dinamicos/editInfo-formulario/${nombreFormulario}/${index+1}`;
    
  }

  // Eliminar auditoría
  deleteAuditoria(element: Auditoria) {
    this.dataSource.data = this.dataSource.data.filter(e => e !== element);
  }

  // Guardar cambios
  saveChanges(): void {
    console.log('Nuevo orden de auditorías:', this.dataSource.data);
  }

  addAuditoria() {
    const nombreFormulario = 'sisifo_form2';
    window.location.href = `http://localhost:4200/formularios-dinamicos/view-formulario/${nombreFormulario}`;
  }
}
