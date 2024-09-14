import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { FormularioAuditoriaEspecialComponent } from '../formulario-auditoria-especial/formulario-auditoria-especial.component';
import { MatDialog } from '@angular/material/dialog';


interface UserData{
  numero: string;
  auditoria: string;
  evaluacion: string;
  auditor: string;
  cronograma: string;
  estado: string;
}
@Component({
  selector: 'app-auditorias-especiales',
  templateUrl: './auditorias-especiales.component.html',
  styleUrls: ['./auditorias-especiales.component.css']
})
export class AuditoriasEspecialesComponent {

  formUsuarios: FormGroup | undefined;
  displayedColumns: string[] = [
    'numero',
    'auditoria',
    'evaluacion',
    'auditor',
    'cronograma',
    'estado',
    'acciones'
  ];
  dataSource = new MatTableDataSource<UserData>([
    {
      numero: '1',
      auditoria: 'Auditoria 1',
      evaluacion: 'evaluacion 1',
      auditor: 'Auditor 1',
      cronograma: 'Ene/May/Sep',
      estado: 'Borrador',
    },
    {
      numero: '2',
      auditoria: 'Auditoria 2',
      evaluacion: 'evaluacion 2',
      auditor: 'Auditor 2',
      cronograma: 'Ago/Nov/Dic',
      estado: 'Borrador',
    },
    { 
      numero: '3',
      auditoria: 'Auditoria 3',
      evaluacion: 'evaluacion 3',
      auditor: 'Auditor 3',
      cronograma: 'Ene/May/Sep',
      estado: 'Borrador',
    }
  ])

  abrirModal() {
    const dialogRef = this.dialog.open(FormularioAuditoriaEspecialComponent, {
      width: '1100px',
    });
  }

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog
  ) { }

}
