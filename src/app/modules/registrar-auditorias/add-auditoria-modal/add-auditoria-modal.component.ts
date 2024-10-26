import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ParametrosService } from 'src/app/services/parametros.service';

interface Evaluacion {
  Id: number;
  Nombre: string;
}

@Component({
  selector: 'app-add-auditoria-modal',
  templateUrl: './add-auditoria-modal.component.html',
  styleUrl: './add-auditoria-modal.component.css'
})
export class AddAuditoriaModalComponent implements OnInit {
  auditoriaForm: FormGroup | any;
  evaluaciones: Evaluacion[] = []
  meses: string[] = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  constructor(
    private fb: FormBuilder,
    private parametrosService: ParametrosService,
    public dialogRef: MatDialogRef<AddAuditoriaModalComponent>
  ) {}

  ngOnInit(): void {
    this.auditoriaForm = this.fb.group({
      tituloActividad: ['', Validators.required],   
      tipoEvaluacion: [[], Validators.required],    
      cronogramaActividades: [[], Validators.required]  
    });
    this.CargarEvaluaciones();
  }

  CargarEvaluaciones() {
    this.parametrosService.get('parametro?query=TipoParametroId:136&limit=0').subscribe((res) => {
      if (res !== null) {
        this.evaluaciones = res.Data;
        console.log("evaluaciones", this.evaluaciones)
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  
  onSave(): void {
    if (this.auditoriaForm.valid) {
      console.log('Datos del formulario:', this.auditoriaForm.value);
      this.dialogRef.close(); 
    } else {
      console.log('El formulario es inválido');
      this.auditoriaForm.markAllAsTouched();  
    }
  }
}
