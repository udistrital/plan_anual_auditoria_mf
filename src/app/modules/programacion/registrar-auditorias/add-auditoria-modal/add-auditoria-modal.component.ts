import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ParametrosService } from 'src/app/services/parametros.service';
import { PlanAnualAuditoriaService } from 'src/app/services/plan-anual-auditoria.service';
import { ModalService } from 'src/app/services/modal.service'; 

interface Respuestas {
  Id: number;
  Nombre: string;
}

@Component({
  selector: 'app-add-auditoria-modal',
  templateUrl: './add-auditoria-modal.component.html',
  styleUrls: ['./add-auditoria-modal.component.css'] // Corrige el 'styleUrl' a 'styleUrls'
})
export class AddAuditoriaModalComponent implements OnInit {
  auditoriaForm: FormGroup| any;
  evaluaciones: Respuestas[] = [];
  meses: Respuestas[] = [];
  planAuditoriaId: string | null = null; 

  constructor(
    private fb: FormBuilder,
    private parametrosService: ParametrosService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService, 
    public dialogRef: MatDialogRef<AddAuditoriaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { planAuditoriaId: string },
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.auditoriaForm = this.fb.group({
      tituloActividad: ['', Validators.required],
      tipoEvaluacion: [[], Validators.required],
      cronogramaActividades: [[], Validators.required]
    });
    this.CargarEvaluaciones();
    this.CargarMeses();
    
  }

  CargarMeses() {
    this.parametrosService.get('parametro?query=TipoParametroId:139&limit=0').subscribe(res => {
      if (res !== null) {
        this.meses = res.Data;
      }
    });
  }

  CargarEvaluaciones() {
    this.parametrosService.get('parametro?query=TipoParametroId:136&limit=0').subscribe(res => {
      if (res !== null) {
        this.evaluaciones = res.Data;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  asignarTodos(): void {
    const todosLosMeses = this.meses.map(mes => mes.Nombre);
    this.auditoriaForm.get('cronogramaActividades').setValue(todosLosMeses);
  }
  
  onSave(): void {
    if (this.auditoriaForm.valid) {
      // Mostrar alerta de confirmación
      this.modalService.modalConfirmacion(
        'Confirmación',
        'warning',
        '¿Está seguro(a) de guardar la auditoría?'
      ).then((result) => {
        if (result.isConfirmed) {
          const formData = {
            planAuditoriaId: this.data.planAuditoriaId,
            titulo: this.auditoriaForm.value.tituloActividad,
            tipoEvaluacionId: this.auditoriaForm.value.tipoEvaluacion[0],
            cronogramaId: this.auditoriaForm.value.cronogramaActividades
          };

          // Realiza la solicitud POST al servicio
          this.planAnualAuditoriaService.post('/auditoria', formData).subscribe({
            next: (response) => {
              console.log('Auditoría guardada con éxito:', response);
              this.modalService.mostrarModal(
                'Auditoría guardada exitosamente.',
                'success',
                'AUDITORÍA GUARDADA'
              );
              this.dialogRef.close();
            },
            error: (error) => {
              console.error('Error al guardar la auditoría:', error);
              this.modalService.mostrarModal(
                'Error al guardar la auditoría. Inténtelo de nuevo.',
                'error',
                'ERROR'
              );
            }
          });
        }
      });
    } else {
      console.log('El formulario es inválido');
      this.auditoriaForm.markAllAsTouched();
    }
  }
}
