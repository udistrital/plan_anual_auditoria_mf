import { Injectable } from '@angular/core';
import { driver, type Driver, type DriveStep } from 'driver.js';
import { Subject } from 'rxjs';

/** Sentido en el que el tour retoma el flujo al terminar de renderizar la página de destino. */
export type DireccionTour = 'previous' | 'next';

interface ContinuacionTour {
  direccion: DireccionTour;
  selector: string;
}

@Injectable({ providedIn: 'root' })
export class TourService {
  /** Clics que el tour NO debe interpretar como "finalizar tour". */
  private static readonly CLIC_IGNORADO =
    '.driver-popover, .cdk-overlay-container, .driver-active-element';

  /** Continuación pendiente de resolver, la consume la página de destino. */
  private static readonly TOUR_NAVEGACION_KEY = 'paa-tour-navegacion';
  private static readonly ESPERA_NAVEGACION_MS = 3000;
  private static readonly INTERVALO_NAVEGACION_MS = 50;

  driverObj: Driver | null = null;
  private listenerClicFuera: ((event: MouseEvent) => void) | null = null;
  private readonly tourFinalizadoSubject = new Subject<void>();
  readonly tourFinalizado$ = this.tourFinalizadoSubject.asObservable();

  /** Iniciar tour */
  iniciarTour(pasosTour: DriveStep[], alFinalizar?: () => void): void {
    this.desregistrarClicFuera();

    this.driverObj = driver({
      showProgress: true,
      allowKeyboardControl: true,   // habilita Esc y flechas de teclado
      allowClose: true,             // habilita la X del popover
      overlayOpacity: 0.65,
      stagePadding: 8,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      steps: pasosTour,
      onCloseClick: () => this.driverObj?.destroy(),
      onDestroyed: () => {
        this.desregistrarClicFuera();
        sessionStorage.removeItem(TourService.TOUR_NAVEGACION_KEY);
        // Se notifica antes de `alFinalizar` porque ese callback navega, y al
        // cambiar de ruta se destruyen los componentes que deben cerrar los
        // overlays que el tour dejó abiertos.
        this.tourFinalizadoSubject.next();
        alFinalizar?.();
      },
    });

    this.registrarClicFuera();
    this.driverObj.drive();
  }

  /**
   * El overlay del tour es transparente al clic (ver `tour-driver.scss`) para
   * que el contenido de los dialogs y menús siga siendo usable, así que
   * driver.js ya no recibe el evento `overlayClick` y el clic por fuera hay que
   * detectarlo aquí.
   *
   * Se considera "por fuera" cualquier clic de usuario que no caiga en el
   * popover, ni en un overlay de Material (para no cerrar menus ni dialogs) ni
   * en el elemento que el tour está enfocando.
   */
  private registrarClicFuera(): void {
    this.listenerClicFuera = (event: MouseEvent): void => {
      // Los clics que dispara el propio tour (boton.click()) no cuentan.
      if (!event.isTrusted) return;
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(TourService.CLIC_IGNORADO)) return;

      this.driverObj?.destroy();
    };

    document.addEventListener('click', this.listenerClicFuera, true);
  }

  private desregistrarClicFuera(): void {
    if (!this.listenerClicFuera) return;

    document.removeEventListener('click', this.listenerClicFuera, true);
    this.listenerClicFuera = null;
  }

  /**
   * Deja indicado que, cuando la página de destino termine de renderizar, el tour
   * debe seguir solo en la dirección indicada. La consume la página de destino
   * con `continuarTourSiCorresponde()`.
   */
  marcarContinuacionTrasNavegar(direccion: DireccionTour, selector: string): void {
    const continuacion: ContinuacionTour = { direccion, selector };
    sessionStorage.setItem(TourService.TOUR_NAVEGACION_KEY, JSON.stringify(continuacion));
  }

  /**
   * La invoca la página de destino una vez montada. Espera a que exista el
   * elemento que el tour debe enfocar y sólo entonces avanza o retrocede, para
   * que driver.js no tenga que resaltar un elemento que todavía no existe.
   *
   * La marca se consume siempre: si el tour se cerró durante la navegación queda
   * limpia y no salta de paso en la siguiente visita.
   */
  continuarTourSiCorresponde(): void {
    const continuacion = this.leerContinuacion();
    if (!continuacion) return;

    this.esperarElemento(continuacion.selector, () => {
      if (continuacion.direccion === 'previous') {
        this.driverObj?.movePrevious();
        return;
      }
      this.driverObj?.moveNext();
    });
  }

  private leerContinuacion(): ContinuacionTour | null {
    const guardado = sessionStorage.getItem(TourService.TOUR_NAVEGACION_KEY);
    sessionStorage.removeItem(TourService.TOUR_NAVEGACION_KEY);
    if (!guardado) return null;

    try {
      const { direccion, selector } = JSON.parse(guardado) as ContinuacionTour;
      const esDireccionValida = direccion === 'previous' || direccion === 'next';
      if (!esDireccionValida || typeof selector !== 'string' || !selector) return null;

      return { direccion, selector };
    } catch {
      return null;
    }
  }

  private esperarElemento(selector: string, alEncontrarlo: () => void): void {
    const limite = Date.now() + TourService.ESPERA_NAVEGACION_MS;

    const sondear = (): void => {
      // Si el elemento nunca aparece se mueve igual: es preferible un popover
      // apuntando a un elemento faltante que dejar el tour congelado en el paso
      // anterior, que ya quedó en una página destruida.
      if (document.querySelector(selector) || Date.now() >= limite) {
        alEncontrarlo();
        return;
      }
      setTimeout(sondear, TourService.INTERVALO_NAVEGACION_MS);
    };

    sondear();
  }

  getDriverObj(): Driver | null {
    return this.driverObj;
  }
}
