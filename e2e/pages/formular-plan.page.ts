/**
 * Plan de mejoramiento › Formulación de planes › Registrar plan (registrar-plan + tabla-hallazgos) y el modal
 * de la acción (modal-registrar-accion), #905 y #947.
 * Ruta: /gestion-auditoria/plan-mejoramiento/registrar-plan/:auditoriaId
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';

export const RUTA_REGISTRAR_PLAN = '/gestion-auditoria/plan-mejoramiento/registrar-plan';

export class FormularPlanPage extends BasePage {
  readonly titulo: Locator;
  /** Filas de hallazgo (fila de grupo: una sola celda que ocupa toda la tabla). */
  readonly filasHallazgo: Locator;
  /** Filas de acción (las que tienen celda de la columna Causa). */
  readonly filasAccion: Locator;

  constructor(page: Page) {
    super(page);
    // Modo edición: el título cambia a «Ver Plan de Mejoramiento» si el plan no es editable
    this.titulo = page.getByRole('heading', { name: 'Editar Plan de Mejoramiento', level: 2 });
    this.filasHallazgo = page.locator('tr.mat-mdc-row').filter({ has: page.locator('td[colspan]') });
    this.filasAccion = page
      .locator('tr.mat-mdc-row')
      .filter({ has: page.locator('td.mat-column-causa'), hasNot: page.locator('td[colspan]') });
  }

  async abrir(auditoriaId: string) {
    await this.abrirRuta(`${RUTA_REGISTRAR_PLAN}/${auditoriaId}`, this.titulo);
    await expect(this.filasHallazgo.first()).toBeVisible({ timeout: 60_000 });
  }

  /** Causa que muestra la tabla en una fila de acción. */
  causaEnFila(fila: Locator): Locator {
    return fila.locator('td.mat-column-causa');
  }

  /** Expande el hallazgo (clic en su número) si tiene acciones y aún no se ven. */
  async expandirHallazgo(fila: Locator) {
    const antes = await this.filasAccion.count();
    await fila.locator('span[style*="cursor"]').first().click();
    await expect.poll(() => this.filasAccion.count()).not.toBe(antes);
  }

  /**
   * Menú de utilidades del hallazgo (Agregar Acción, Remitir Hallazgo, Histórico de Remisiones).
   * El botón solo tiene el ícono more_vert, sin nombre accesible: se ubica por CSS dentro de la fila.
   */
  async abrirAgregarAccion(fila: Locator): Promise<ModalAccionDialog> {
    await fila.locator('button[mat-icon-button]').last().click();
    await this.page.getByRole('menuitem', { name: /Agregar Acción/ }).click();
    const modal = new ModalAccionDialog(this.page);
    await modal.esperarAbierto();
    return modal;
  }

  /** Menú de la fila de acción → Editar Acción (mismo caso: botón solo con ícono). */
  async abrirEditarAccion(fila: Locator): Promise<ModalAccionDialog> {
    await fila.locator('td.mat-column-acciones button').click();
    await this.page.getByRole('menuitem', { name: /Editar Acción/ }).click();
    const modal = new ModalAccionDialog(this.page);
    await modal.esperarAbierto();
    return modal;
  }
}

export class ModalAccionDialog extends BasePage {
  readonly dialogo: Locator;
  readonly causa: Locator;
  readonly contadorCausa: Locator;
  readonly errorCausa: Locator;
  readonly botonGuardar: Locator;
  readonly botonDescartar: Locator;

  constructor(page: Page) {
    super(page);
    this.dialogo = page.locator('mat-dialog-container').filter({ has: page.locator('app-modal-registrar-accion') });
    this.causa = this.dialogo.getByRole('textbox', { name: /Causa del hallazgo/ });
    // `has` se resuelve dentro del campo: va un locator relativo, no this.causa (que empieza en el diálogo)
    const campoCausa = this.dialogo
      .locator('mat-form-field')
      .filter({ has: page.getByRole('textbox', { name: /Causa del hallazgo/ }) });
    this.contadorCausa = campoCausa.locator('mat-hint').filter({ hasText: /\/\s*\d+/ });
    this.errorCausa = campoCausa.locator('mat-error');
    this.botonGuardar = this.dialogo.getByRole('button', { name: /Guardar acción/ });
    this.botonDescartar = this.dialogo.getByRole('button', { name: /Descartar/ });
  }

  async esperarAbierto() {
    await expect(this.causa).toBeVisible({ timeout: 30_000 });
    // Fin de la animación de apertura (Material agrega mdc-dialog--open) y de la carga de dependencias
    await expect(this.dialogo).toHaveClass(/mdc-dialog--open/);
    await expect(this.dialogo.locator('mat-spinner, mat-progress-spinner')).toHaveCount(0, { timeout: 30_000 });
  }

  async escribirCausa(texto: string) {
    await this.causa.fill(texto);
  }

  async descartar() {
    await this.botonDescartar.click();
    await expect(this.dialogo).toBeHidden();
  }
}
