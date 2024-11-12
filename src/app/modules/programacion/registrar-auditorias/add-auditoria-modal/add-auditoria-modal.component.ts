import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ParametrosService } from 'src/app/services/parametros.service';
import { PlanAnualAuditoriaService } from 'src/app/services/plan-anual-auditoria.service';
import { ModalService } from 'src/app/services/modal.service'; 
import { Parametro } from 'src/app/data/models/parametros/parametros';
import { Auditoria } from 'src/app/data/models/plan-anual-auditoria/plan-anual-auditoria';

@Component({
  selector: 'app-add-auditoria-modal',
  templateUrl: './add-auditoria-modal.component.html',
  styleUrls: ['./add-auditoria-modal.component.css'] // Corrige el 'styleUrl' a 'styleUrls'
})
export class AddAuditoriaModalComponent implements OnInit {
  auditoriaForm: FormGroup| any;
  evaluaciones: Parametro[] = [];
  meses: Parametro[] = [];
  isEditMode = false;
  TODOS = 'Todos';

  constructor(
    private fb: FormBuilder,
    private parametrosService: ParametrosService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService, 
    public dialogRef: MatDialogRef<AddAuditoriaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { planAuditoriaId: string; auditoria?: Auditoria },
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data.auditoria; 
    this.auditoriaForm = this.fb.group({
      tituloActividad: [this.data.auditoria?.auditoria || '', Validators.required],
      tipoEvaluacion: [this.data.auditoria?.tipoEvaluacion || [], Validators.required],
      cronogramaActividades: [this.data.auditoria?.cronograma || [], Validators.required]
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
    const seleccion = [this.TODOS];
    this.auditoriaForm.get('cronogramaActividades').setValue(seleccion);
  }

  onMesChange(): void {
    const seleccionados = this.auditoriaForm.get('cronogramaActividades').value;
  
    if (seleccionados.includes(this.TODOS) && seleccionados.length > 1) {
      this.auditoriaForm.get('cronogramaActividades').setValue(
        seleccionados.filter((mes: string) => mes !== this.TODOS)
      );
    }

    if (seleccionados.length === 0) {
      this.auditoriaForm.get('cronogramaActividades').setValue([this.TODOS]);
    }
  }
  
   
  onSave(): void {
    if (this.auditoriaForm.valid) {
      this.modalService.modalConfirmacion(
        'Confirmación',
        'warning',
        `¿Está seguro(a) de ${this.isEditMode ? 'actualizar' : 'guardar'} la auditoría?`
      ).then((result) => {
        if (result.isConfirmed) {
          const formData = {
            planAuditoriaId: this.data.planAuditoriaId,
            titulo: this.auditoriaForm.value.tituloActividad,
            tipoEvaluacionId: this.auditoriaForm.value.tipoEvaluacion,
            cronogramaId: this.auditoriaForm.value.cronogramaActividades
          };

          const request$ = this.isEditMode 
            ? this.planAnualAuditoriaService.put(`/auditoria/${this.data.auditoria!.id}`, formData)
            : this.planAnualAuditoriaService.post('/auditoria', formData);

          request$.subscribe({
            next: (response) => {
              this.modalService.mostrarModal(
                `Auditoría ${this.isEditMode ? 'actualizada' : 'guardada'} exitosamente.`,
                'success',
                'ÉXITO'
              );
              this.dialogRef.close({ saved: true });
            },
            error: (error) => {
              this.modalService.mostrarModal(
                `Error al ${this.isEditMode ? 'actualizar' : 'guardar'} la auditoría. Inténtelo de nuevo.`,
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
