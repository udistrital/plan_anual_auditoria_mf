import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

export interface AuditoriaHija {
  nombre: string;
  estado: string;
}

@Component({
    selector: 'app-modal-auditorias-hijas',
    templateUrl: './modal-auditorias-hijas.component.html',
    standalone: false
})
export class ModalAuditoriasHijasComponent {
  displayedColumns = ['nombre', 'estado'];
  dataSource: MatTableDataSource<AuditoriaHija>;

  constructor(
    public dialogRef: MatDialogRef<ModalAuditoriasHijasComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { hijas: AuditoriaHija[]; accion: 'editar' | 'eliminar' }
  ) {
    this.dataSource = new MatTableDataSource(data.hijas);
  }

  confirmar() { this.dialogRef.close(true); }
  cancelar()  { this.dialogRef.close(false); }
}
