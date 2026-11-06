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

  /**
   * Elige la vigencia y espera el listado NUEVO: la tabla anterior sigue en pantalla hasta que llega la
   * respuesta (GET gestion-accion/<vista>/…, sin /resumen), así que se espera la respuesta y sus filas.
   */
  async elegirVigencia(vigencia: string) {
    const listado = this.page.waitForResponse(
      (r) => r.request().method() === 'GET' && /\/gestion-accion\/.+/.test(new URL(r.url()).pathname) && !/\/resumen$/.test(new URL(r.url()).pathname),
      { timeout: 60_000 },
    );
    await this.campoVigencia.click();
    const opcion = this.page.getByRole('option', { name: vigencia, exact: true });
    // Si ya estaba elegida, Material no vuelve a consultar: se cierra el selector y se usa lo que hay
    const yaElegida = (await opcion.getAttribute('aria-selected')) === 'true';
    await opcion.click();
    if (!yaElegida) {
      const datos = (await (await listado).json())?.Data;
      await expect(this.filas).toHaveCount(Array.isArray(datos) ? Math.min(datos.length, 25) : 0);
    } else {
      void listado.catch(() => undefined);
    }
    await expect(this.filas.first().or(this.sinResultados)).toBeVisible();
  }

  /** Vigencias del selector, en su orden (la más reciente primero). */
  async vigencias(): Promise<string[]> {
    await this.campoVigencia.click();
    await expect(this.page.getByRole('option').first()).toBeVisible();
    const textos = (await this.page.getByRole('option').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    await this.page.keyboard.press('Escape');
    await expect(this.page.getByRole('option')).toHaveCount(0);
    return textos;
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

  /**
   * Primera fila (entre las `maxFilas` primeras) cuya opción principal del menú es una de `opciones`, y la elige.
   * Desde #916 la opción depende del estado y del rol (p. ej. "Calificar" solo en EN_REVISION y para el auditor
   * del plan), así que la primera fila del listado no sirve siempre. Devuelve la opción elegida, o null si no hay.
   */
  async elegirFilaConOpcion(opciones: string[], maxFilas = 10): Promise<string | null> {
    const total = Math.min(await this.filas.count(), maxFilas);
    for (let i = 0; i < total; i++) {
      const texto = await this.abrirMenuFila(this.filas.nth(i));
      const opcion = opciones.find((o) => texto.endsWith(o)); // el texto incluye el nombre del ícono
      if (opcion) {
        await this.elegirPrimeraOpcion();
        return opcion;
      }
      await this.page.keyboard.press('Escape');
      await expect(this.page.getByRole('menuitem')).toHaveCount(0);
    }
    return null;
  }
}
