import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import {ModalConfirmarRechazoComponent} from '../modal-confirmar-rechazo/modal-confirmar-rechazo.component'
@Component({
  selector: 'app-modal-motivos-rechazo',
  templateUrl: './modal-motivos-rechazo.component.html',
  styleUrls: ['./modal-motivos-rechazo.component.css']
})
export class ModalMotivosRechazoComponent {
  constructor(public dialogRef: MatDialogRef<ModalMotivosRechazoComponent>, public dialog: MatDialog) {}
  onClose(): void {
    this.dialogRef.close();
  }
  openConfirmarRechazo(): void {
    this.dialogRef.close();
    this.dialog.open(ModalConfirmarRechazoComponent, {
      width: '60vw',
      data: {
        mensaje: '¿Está seguro(a) de realizar esta acción?',  // Mensaje actualizado
        icono: 'warning',
        mostrarBotonCancelar: true,
        textoConfirmacion: 'Aceptar',
        continue:true,
        textoMensajeConfirmacion:'PLAN RECHAZADO',
        textoSubMensajeConfirmacion:'El Plan fue devuelto al auditor (a)',
      }
    });
  }
}
