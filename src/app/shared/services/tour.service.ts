import { Injectable } from '@angular/core';
import { driver, type Driver, type DriveStep } from 'driver.js';

@Injectable({ providedIn: 'root' })
export class TourService {
  driverObj: Driver | null = null;

  /** Iniciar tour */
  iniciarTour(pasosTour: DriveStep[], alFinalizar?: () => void): void {
    this.driverObj = driver({
      showProgress: true,
      allowKeyboardControl: true,   // habilita Esc y flechas de teclado
      allowClose: true,             // permite cerrar haciendo clic fuera
      overlayOpacity: 0.65,
      stagePadding: 8,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      steps: pasosTour,
      onCloseClick: () => this.driverObj?.destroy(),
      onDestroyed: () => {
        alFinalizar?.();
      },
    });

    this.driverObj.drive();
  }

  getDriverObj(): Driver | null {
    return this.driverObj;
  }
}