/**
 * Programación › Registro Auditorías Especiales (registro-auditorias-especiales + tabla-auditorias-especiales):
 * auditorías padre sin PAA y, al expandir cada una, sus auditorías concretas.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';

export class AuditoriasEspecialesPage extends BasePage {
  readonly titulo: Locator;
  readonly selectorVigencia: Locator;
  readonly botonCrear: Locator;
  readonly tituloListado: Locator;
  readonly tabla: Locator;
  readonly encabezados: Locator;
  /** Filas de auditorías padre (las que tienen el botón de expandir). */
  readonly filasPadre: Locator;
  readonly menuAcciones: Locator;

  constructor(page: Page) {
    super(page);
    this.titulo = page.getByRole('heading', { name: 'Registro Auditorías Especiales', level: 2 });
    this.selectorVigencia = page.getByRole('combobox', { name: 'Seleccione una vigencia:' });
    this.botonCrear = page.getByRole('button', { name: 'Crear Auditoría Especial' });
    this.tituloListado = page.getByRole('heading', { name: 'Listado de Auditorías Especiales Registradas' });
    this.tabla = page.locator('plantilla-tarjeta-contenedora table').first();
    this.encabezados = this.tabla.getByRole('columnheader');
    this.filasPadre = this.tabla.getByRole('row').filter({ has: page.getByRole('button', { name: /auditorías concretas/ }) });
    this.menuAcciones = page.getByRole('menu');
  }

  async abrir() {
    await this.abrirRuta('/gestion-auditoria/programacion/auditorias-especiales', this.selectorVigencia);
  }

  async elegirVigencia(vigencia: string) {
    await this.selectorVigencia.click();
    await this.page.getByRole('option', { name: vigencia, exact: true }).click();
  }

  filaPadre(titulo: string | RegExp): Locator {
    return this.filasPadre.filter({ hasText: titulo }).first();
  }

  /** Filas de auditorías concretas visibles (se insertan debajo de su padre al expandir). */
  readonly filasConcretas = this.page.locator('tr.fila-auditoria-concreta');

  /** Expande la fila padre: el botón pasa a "Colapsar auditorías concretas". */
  async expandir(fila: Locator) {
    await fila.getByRole('button', { name: 'Expandir auditorías concretas' }).click();
    await expect(fila.getByRole('button', { name: 'Colapsar auditorías concretas' })).toBeVisible({ timeout: 60_000 });
  }

  async abrirAcciones(fila: Locator): Promise<string[]> {
    await fila.locator('td:last-child button').click();
    await expect(this.menuAcciones).toBeVisible();
    return (await this.menuAcciones.getByRole('menuitem').allInnerTexts()).map((t) => t.split('\n').pop()!.trim());
  }
}
