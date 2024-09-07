import { Component, Inject, Input} from '@angular/core';
import Swal from 'sweetalert2';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-confirmar-rechazo',
  templateUrl: './modal-confirmar-rechazo.component.html',
  styleUrls: ['./modal-confirmar-rechazo.component.css']
})
export class ModalConfirmarRechazoComponent {

  mensaje: string;
  icono: 'warning' | 'success' | 'error' | 'info';
  mostrarBotonCancelar: boolean;
  textoConfirmacion: string;
  textoCancelacion: string;
  continue:boolean;
  textoMensajeConfirmacion: string;
  textoSubMensajeConfirmacion:string;

  constructor(
    public dialogRef: MatDialogRef<ModalConfirmarRechazoComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { 
    this.mensaje = data.mensaje || '¿Está seguro(a) de realizar esta acción?';
    this.icono = data.icono || 'warning';
    this.mostrarBotonCancelar = data.mostrarBotonCancelar !== undefined ? data.mostrarBotonCancelar : true;
    this.textoConfirmacion = data.textoConfirmacion || 'Aceptar';
    this.textoCancelacion = data.textoCancelacion || 'Cancelar';
    this.continue = data.continue;
    this.textoMensajeConfirmacion =data.textoMensajeConfirmacion;
    this.textoSubMensajeConfirmacion =data.textoSubMensajeConfirmacion || '';
  }
    
  ngOnInit(): void {
    this.mostrarModal();
}
mostrarModal(): void {
  const htmlContent = `
    <h1 style="margin-bottom: 5px; color:hsl(0deg 0% 59.61%);">${this.mensaje}</h1>
    ${this.textoSubMensajeConfirmacion && !this.continue ? `<h3 style="color:hsl(0deg 0% 59.61%);">${this.textoSubMensajeConfirmacion}</h3>` : ''}
  `;
  Swal.fire({
    html: htmlContent,
    icon: this.icono,
    showCancelButton: this.mostrarBotonCancelar,
    confirmButtonText: this.textoConfirmacion,
    cancelButtonText: this.textoCancelacion,
    confirmButtonColor: '#3085d6', 
    cancelButtonColor: '#d33',
    
  }).then((result) => {
    this.dialogRef.close();
    if (result.isConfirmed && this.continue) {
      // Lógica para cuando se presiona "Aceptar"
      
      console.log('Plan rechazado');

      // Abrir otro modal igual
      this.dialog.open(ModalConfirmarRechazoComponent, {
        data: {
          mensaje: this.textoMensajeConfirmacion,  
          icono: 'success',
          mostrarBotonCancelar: false,
          textoConfirmacion: 'OK',
          continue:false,
          textoSubMensajeConfirmacion:this.textoSubMensajeConfirmacion,
        }
        
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      // Lógica para cuando se presiona "Cancelar"
      console.log('Acción cancelada');
    }
  });
}
}
