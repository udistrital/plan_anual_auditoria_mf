/**
 * Planeación y Ejecución › Auditorías internas (auditorias-internas + tabla-auditorias-internas: las
 * dos fases tienen la misma pantalla de listado por vigencia) y el informe de Ejecución
 * (editar-informe: stepper de 4 pasos; el 4 es el resumen de hallazgos, resumen-hallazgos).
 * Rutas: /gestion-auditoria/<fase>/auditorias-internas y .../ejecucion/auditorias-internas/editar-informe/:id
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';

export type FaseAuditoriasInternas = 'planeacion' | 'ejecucion';

export class AuditoriasInternasPage extends BasePage {
  readonly selectorVigencia: Locator;
  readonly tabla: Locator;
  readonly filas: Locator;
  readonly menuAcciones: Locator;

  constructor(page: Page, private readonly fase: FaseAuditoriasInternas) {
    super(page);
    this.selectorVigencia = page.getByRole('combobox', { name: 'Seleccione una vigencia:' });
    this.tabla = page.locator('app-tabla-auditorias-internas table').first();
    this.filas = this.tabla.locator('tbody tr, tr[mat-row]');
    this.menuAcciones = page.getByRole('menu');
  }

  async abrir() {
    await this.abrirRuta(`/gestion-auditoria/${this.fase}/auditorias-internas`, this.selectorVigencia);
  }

  async elegirVigencia(vigencia: string) {
    await this.selectorVigencia.click();
    await this.page.getByRole('option', { name: vigencia, exact: true }).click();
  }

  /** Fila de la auditoría por su título (la tabla no muestra el consecutivo OCI). */
  filaAuditoria(texto: string | RegExp): Locator {
    return this.filas.filter({ hasText: texto }).first();
  }

  /** Abre el menú de la fila y devuelve los nombres de sus acciones. */
  async abrirAcciones(fila: Locator): Promise<string[]> {
    await fila.locator('td:last-child button').click();
    await expect(this.menuAcciones).toBeVisible();
    return (await this.menuAcciones.getByRole('menuitem').allInnerTexts()).map((t) => t.split('\n').pop()!.trim());
  }

  /** Cierra el menú de acciones sin elegir nada. */
  async cerrarAcciones() {
    await this.page.keyboard.press('Escape');
    await expect(this.menuAcciones).toBeHidden();
  }

  /** Abre el menú de la fila y elige la acción ("Ver Preinforme", "Iniciar Ejecución", …). */
  async accion(fila: Locator, nombre: string) {
    await this.abrirAcciones(fila);
    await this.menuAcciones.getByRole('menuitem', { name: new RegExp(`${nombre}$`) }).click();
  }
}

export class InformeAuditoriaPage extends BasePage {
  readonly stepper: Locator;
  readonly pasoResumen: Locator;
  readonly tablaResumen: Locator;
  readonly encabezadosResumen: Locator;
  readonly filasResumen: Locator;

  constructor(page: Page) {
    super(page);
    this.stepper = page.locator('mat-stepper, mat-horizontal-stepper, mat-vertical-stepper').first();
    this.pasoResumen = page.getByRole('tab', { name: /Resumen de Hallazgos/ });
    this.tablaResumen = page.locator('app-resumen-hallazgos table');
    this.encabezadosResumen = this.tablaResumen.getByRole('columnheader');
    this.filasResumen = this.tablaResumen.locator('tr[mat-row]');
  }

  async esperarCarga() {
    await expect(this.page).toHaveURL(/\/ejecucion\/auditorias-internas\/editar-informe\//, { timeout: 60_000 });
    await expect(this.pasoResumen).toBeVisible({ timeout: 60_000 });
  }

  async irAlResumen() {
    await this.pasoResumen.click();
    await expect(this.tablaResumen).toBeVisible({ timeout: 60_000 });
  }

  /** Filas del resumen como { numero, criterio, descripcion } (en el orden de las columnas). */
  async resumen(): Promise<{ numero: string; criterio: string; descripcion: string }[]> {
    const filas: { numero: string; criterio: string; descripcion: string }[] = [];
    for (const fila of await this.filasResumen.all()) {
      const [numero, criterio, descripcion] = (await fila.locator('td').allInnerTexts()).map((t) => t.trim());
      filas.push({ numero, criterio, descripcion });
    }
    return filas;
  }
}
