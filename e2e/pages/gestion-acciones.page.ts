/**
 * Plan de mejoramiento → Gestión de acciones: listado de acciones de planes aprobados por vigencia.
 * Ruta: /gestion-auditoria/plan-mejoramiento/gestion-acciones
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';

export const RUTA_GESTION_ACCIONES = '/gestion-auditoria/plan-mejoramiento/gestion-acciones';

export class GestionAccionesPage extends BasePage {
  readonly selectorVigencia: Locator;
  /** Campo que contiene el selector: la etiqueta de Material tapa el select mientras está vacío. */
  readonly campoVigencia: Locator;
  /** Filas con acciones (excluye la fila "No se encontraron acciones…"). */
  readonly filas: Locator;
  readonly sinResultados: Locator;

  constructor(page: Page) {
    super(page);
    this.selectorVigencia = page.getByRole('combobox').first();
    this.campoVigencia = page.locator('mat-card mat-form-field').filter({ has: page.locator('mat-select') }).first();
    this.filas = page.locator('tr.mat-mdc-row').filter({ has: page.getByRole('button') });
    this.sinResultados = page.getByText('No se encontraron acciones con los filtros aplicados.');
  }

  async abrir() {
    await this.abrirRuta(RUTA_GESTION_ACCIONES, this.selectorVigencia);
  }

  async elegirVigencia(vigencia: string) {
    await this.campoVigencia.click();
    await this.page.getByRole('option', { name: vigencia, exact: true }).click();
    await expect(this.filas.first().or(this.sinResultados)).toBeVisible();
  }

  fila(texto: string | RegExp): Locator {
    return this.filas.filter({ hasText: texto }).first();
  }

  /** Abre el menú de acciones de la fila y devuelve el texto de su primera opción. */
  async abrirMenuFila(fila: Locator): Promise<string> {
    await fila.getByRole('button').last().click();
    const opcion = this.page.getByRole('menuitem').first();
    await expect(opcion).toBeVisible();
    return (await opcion.innerText()).replace(/\s+/g, ' ').trim();
  }

  async elegirPrimeraOpcion() {
    await this.page.getByRole('menuitem').first().click();
  }
}
