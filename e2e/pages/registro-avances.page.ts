/**
 * Registro de avances de una acción de mejora (#924) y su variante de revisión del auditor (#925).
 * Rutas: .../gestion-acciones/registrar-avances/:id (auditado) y .../gestion-acciones/revisar/:id (auditor)
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';
import { RUTA_GESTION_ACCIONES } from './gestion-acciones.page';
import { FormularioCalificacion } from './formulario-calificacion.page';
import { PanelFichaAccion } from './panel-ficha-accion.page';

export type VarianteRegistro = 'registrar-avances' | 'revisar';

export class RegistroAvancesPage extends BasePage {
  readonly encabezado: Locator;
  readonly chips: Locator;
  readonly tituloEvidencias: Locator;
  readonly tituloCalificacion: Locator;
  readonly botonFicha: Locator;
  readonly botonForo: Locator;
  readonly botonHistorial: Locator;
  readonly enlaceVerHallazgo: Locator;
  readonly botonAnadirDocumento: Locator;
  readonly botonCargue: Locator;
  readonly botonNuevaCalificacion: Locator;
  readonly stepper: Locator;
  readonly calificacionVigente: Locator;
  readonly sinCalificacion: Locator;
  readonly formulario: FormularioCalificacion;
  readonly ficha: PanelFichaAccion;

  constructor(page: Page) {
    super(page);
    this.encabezado = page.locator('.encabezado');
    this.chips = page.locator('.encabezado .chips');
    this.tituloEvidencias = page.locator('#tituloEvidencias');
    this.tituloCalificacion = page.locator('#tituloCalificacion');
    this.botonFicha = page.getByRole('button', { name: 'Ficha de la acción' });
    this.botonForo = page.getByRole('button', { name: 'Foro' });
    this.botonHistorial = page.getByRole('button', { name: /Historial \(\d+\)/ });
    this.enlaceVerHallazgo = page.getByRole('button', { name: 'Ver hallazgo' });
    this.botonAnadirDocumento = page.getByRole('button', { name: 'Añadir documento' });
    this.botonCargue = page.getByRole('button', { name: /Bloquear cargue para revisar|Habilitar cargue/ });
    this.botonNuevaCalificacion = page.getByRole('button', { name: 'Nueva calificación' });
    this.stepper = page.locator('mat-stepper');
    this.calificacionVigente = page.locator('.calificacion-vigente');
    this.sinCalificacion = page.getByText('El auditor aún no ha calificado esta acción.');
    this.formulario = new FormularioCalificacion(page);
    this.ficha = new PanelFichaAccion(page);
  }

  async abrir(accionId: string, variante: VarianteRegistro) {
    await this.abrirRuta(`${RUTA_GESTION_ACCIONES}/${variante}/${accionId}`, this.encabezado);
  }

  /** Espera a que la página cargue después de entrar desde el listado. */
  async esperarCarga() {
    await expect(this.encabezado).toBeVisible({ timeout: 60_000 });
  }

  async textosChips(): Promise<string[]> {
    const textos = await this.chips.locator('.chip').allInnerTexts();
    return textos.map((t) => t.replace(/\s+/g, ' ').trim());
  }

  async abrirFicha() {
    await this.botonFicha.click();
    await this.ficha.esperarAbierto();
  }

  async abrirFichaEnHallazgo() {
    await this.enlaceVerHallazgo.click();
    await this.ficha.esperarAbierto();
  }

  /** Pasa a modo edición de la calificación si ya hay una vigente. */
  async iniciarCalificacion() {
    if (await this.botonNuevaCalificacion.isVisible()) await this.botonNuevaCalificacion.click();
    await expect(this.formulario.raiz).toBeVisible();
  }
}
