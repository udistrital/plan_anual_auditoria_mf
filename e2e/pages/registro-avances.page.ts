/**
 * Registro de avances de una acción de mejora (#924) y su variante de revisión del auditor (#925).
 * Ruta desde el listado (#916): .../gestion-acciones/registrar-avances/:id para los dos roles; la vista la decide el
 * rol (auditor del plan o auditado). .../gestion-acciones/revisar/:id sigue existiendo (se usa con E2E_ACCION_ID).
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';
import { RUTA_GESTION_ACCIONES } from './gestion-acciones.page';
import { FormularioCalificacion } from './formulario-calificacion.page';
import { PanelFichaAccion } from './panel-ficha-accion.page';
import { PanelForo } from './panel-foro.page';

export type VarianteRegistro = 'registrar-avances' | 'revisar';

export class RegistroAvancesPage extends BasePage {
  readonly encabezado: Locator;
  readonly chips: Locator;
  readonly tituloEvidencias: Locator;
  readonly tituloCalificacion: Locator;
  readonly botonFicha: Locator;
  readonly botonForo: Locator;
  readonly botonHistorial: Locator;
  readonly enlacesVerDetalle: Locator;
  readonly botonAnadirDocumento: Locator;
  readonly botonCargue: Locator;
  readonly botonNuevaCalificacion: Locator;
  readonly stepper: Locator;
  readonly calificacionVigente: Locator;
  readonly sinCalificacion: Locator;
  readonly formulario: FormularioCalificacion;
  readonly ficha: PanelFichaAccion;
  readonly foro: PanelForo;

  constructor(page: Page) {
    super(page);
    this.encabezado = page.locator('.encabezado');
    this.chips = page.locator('.encabezado .chips');
    this.tituloEvidencias = page.locator('#tituloEvidencias');
    this.tituloCalificacion = page.locator('#tituloCalificacion');
    this.botonFicha = page.getByRole('button', { name: 'Ficha de la acción' });
    this.botonForo = page.getByRole('button', { name: 'Foro' });
    this.botonHistorial = page.getByRole('button', { name: /Historial \(\d+\)/ });
    // Enlaces retirados en #947 (se usan para comprobar que ya no están)
    this.enlacesVerDetalle = page.getByRole('button', { name: /^Ver (hallazgo|acción)$/ });
    this.botonAnadirDocumento = page.getByRole('button', { name: 'Añadir documento' });
    this.botonCargue = page.getByRole('button', { name: /Bloquear cargue para revisar|Habilitar cargue/ });
    this.botonNuevaCalificacion = page.getByRole('button', { name: 'Nueva calificación' });
    this.stepper = page.locator('mat-stepper');
    this.calificacionVigente = page.locator('.calificacion-vigente');
    this.sinCalificacion = page.getByText('El auditor aún no ha calificado esta acción.');
    this.formulario = new FormularioCalificacion(page);
    this.ficha = new PanelFichaAccion(page);
    this.foro = new PanelForo(page);
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

  /** Abre el panel del foro y espera a que lea los mensajes. */
  async abrirForo() {
    await this.botonForo.click();
    await this.foro.esperarAbierto();
  }

  /** Desde #947 no hay enlace «Ver hallazgo»: se abre la ficha y se pasa a su pestaña Hallazgo. */
  async abrirFichaEnHallazgo() {
    await this.abrirFicha();
    await this.ficha.pestana('Hallazgo').click();
  }

  /** Pasa a modo edición de la calificación si ya hay una vigente. */
  async iniciarCalificacion() {
    if (await this.botonNuevaCalificacion.isVisible()) await this.botonNuevaCalificacion.click();
    await expect(this.formulario.raiz).toBeVisible();
  }
}
