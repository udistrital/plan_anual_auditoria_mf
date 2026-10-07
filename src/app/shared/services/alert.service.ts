import { Injectable } from "@angular/core";
// @ts-ignore
import Swal, { SweetAlertResult } from "sweetalert2";

@Injectable({
  providedIn: "root",
})
export class AlertService {
  // z-index por encima del overlay del CDK.
  // Garantiza que las alertas SweetAlert aparezcan al frente aun cuando se disparen
  // desde dentro de un MatDialog.
  private readonly Z_INDEX_SOBRE_OVERLAY = 20000;

  constructor() {}

  // Fuerza el z-index del contenedor de SweetAlert por encima de los overlays de Material.
  private elevarAlFrente = (): void => {
    const contenedor = Swal.getContainer();
    if (contenedor) {
      contenedor.style.zIndex = String(this.Z_INDEX_SOBRE_OVERLAY);
    }
  };

  showAlert(title: string, text: string) {
    Swal.fire({
      heightAuto: false,
      didOpen: this.elevarAlFrente,
      icon: "info",
      title: title,
      text: text,
      confirmButtonText: "Aceptar",
      customClass: {
        confirmButton: "alertaConfirmarBoton",
        cancelButton: "alertaCancelarBoton",
        icon: "alertaIconoWarn",
      },
    });
  }

  showSuccessAlert(text: string, title: string = "Operación exitosa"): Promise<SweetAlertResult> {
    return Swal.fire({
      heightAuto: false,
      didOpen: this.elevarAlFrente,
      icon: "success",
      title: title,
      text: text,
      confirmButtonText: "Aceptar",
      customClass: {
        confirmButton: "alertaConfirmarBoton",
        cancelButton: "alertaCancelarBoton",
        icon: "alertaIconoSuccess",
      },
    });
  }

  showErrorAlert(text: string): Promise<SweetAlertResult> {
    return Swal.fire({
      heightAuto: false,
      didOpen: this.elevarAlFrente,
      icon: "error",
      title: "Error",
      text: text,
      confirmButtonText: "Aceptar",
      customClass: {
        confirmButton: "alertaConfirmarBoton",
        cancelButton: "alertaCancelarBoton",
      },
    });
  }

  showConfirmAlert(text: string, title: string = "Atención"): Promise<SweetAlertResult> {
    return Swal.fire({
      heightAuto: false,
      didOpen: this.elevarAlFrente,
      title: title,
      text: text,
      icon: "warning",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      confirmButtonText: "Aceptar",
      customClass: {
        confirmButton: "alertaConfirmarBoton",
        cancelButton: "alertaCancelarBoton",
        icon: "alertaIconoConfirmacion",
      },
    });
  }

  showNotification(title: string, text: string): Promise<any> {
    return Swal.fire({
      heightAuto: false,
      didOpen: this.elevarAlFrente,
      icon: "info",
      title: title,
      text: text,
      confirmButtonText: "Aceptar",
      customClass: {
        confirmButton: "alertaConfirmarBoton",
        icon: "alertaIconoWarn",
      },
    });
  }
}
