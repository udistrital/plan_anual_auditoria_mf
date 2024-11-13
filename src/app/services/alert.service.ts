import { Injectable } from '@angular/core';
// @ts-ignore
import Swal from 'sweetalert2/dist/sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  constructor() {}

  showAlert(title: string, text: string) {
    Swal.fire({
      icon: 'info',
      title: title,
      text: text,
      confirmButtonText: 'Aceptar',
    });
  }

  showSuccessAlert(text: string) {
    Swal.fire({
      icon: 'success',
      title: 'Operación exitosa',
      text: text,
      confirmButtonText: 'Aceptar',
    });
  }

  showErrorAlert(text: string) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: text,
      confirmButtonText: 'Aceptar',
    });
  }

  showConfirmAlert(text: string, title: string = 'Atención'): Promise<any> {
    return Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
    });
  }
}
