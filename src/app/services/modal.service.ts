import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  constructor() { }

  mostrarModal(
    mensaje: string, 
    icono: 'success' | 'error' | 'warning' | 'info', 
    titulo: string): void {
    Swal.fire({
      title: titulo.toUpperCase(),
      text: mensaje,
      icon: icono,
      confirmButtonText: 'OK',
      confirmButtonColor: 'rgb(47, 165, 244)',
    });
  }

  modalConfirmacion(
    mensaje: string, 
    icono: 'success' | 'error' | 'warning' | 'info', 
    titulo: string): Promise<any> {
    return Swal.fire({
      title: titulo,
      text: mensaje,
      icon: icono,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: 'rgb(47, 165, 244)',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: 'rgb(248, 24, 22)',
    });  
  }  
}
