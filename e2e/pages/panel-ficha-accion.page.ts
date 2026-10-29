/**
 * Panel lateral "Ficha de la acción" (MatDialog anclado a la derecha) con pestañas
 * Acción · Hallazgo · Auditoría · Responsables.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';

export class PanelFichaAccion extends BasePage {
  readonly dialogo: Locator;
  readonly titulo: Locator;
  readonly pestanas: Locator;
  readonly pestanaActiva: Locator;
  readonly botonCerrar: Locator;

  constructor(page: Page) {
    super(page);
    this.dialogo = page.locator('mat-dialog-container').filter({ has: page.locator('app-panel-ficha-accion') });
    this.titulo = this.dialogo.getByRole('heading', { name: /Ficha de la acción/ });
    this.pestanas = this.dialogo.getByRole('tablist', { name: 'Secciones de la ficha' });
    this.pestanaActiva = this.pestanas.locator('[role=tab][aria-selected=true]');
    this.botonCerrar = this.dialogo.getByRole('button', { name: 'Cerrar' });
  }

  async esperarAbierto() {
    await expect(this.titulo).toBeVisible();
  }

  pestana(nombre: string): Locator {
    return this.pestanas.getByRole('tab', { name: nombre });
  }

  async nombrePestanaActiva(): Promise<string> {
    return (await this.pestanaActiva.innerText()).trim();
  }

  /** Recorre las pestañas con la flecha derecha (navegación por teclado del tablist). */
  async recorrerConFlechas(veces: number): Promise<string[]> {
    await this.pestanaActiva.focus();
    const nombres: string[] = [];
    for (let i = 0; i < veces; i++) {
      await this.page.keyboard.press('ArrowRight');
      nombres.push(await this.nombrePestanaActiva());
    }
    return nombres;
  }

  async cerrarConEscape() {
    await this.page.keyboard.press('Escape');
    await expect(this.dialogo).toBeHidden();
  }

  async cerrar() {
    await this.botonCerrar.click();
    await expect(this.dialogo).toBeHidden();
  }
}
