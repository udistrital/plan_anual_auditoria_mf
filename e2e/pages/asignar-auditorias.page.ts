/**
 * Programación › Asignar Auditorías del PAA (asignar-auditorias + tabla-consulta-auditorias) y el
 * modal de asignación de auditores (modal-agregar-auditor, que también usan las auditorías especiales).
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';

export class AsignarAuditoriasPage extends BasePage {
  readonly titulo: Locator;
  readonly selectorVigencia: Locator;
  readonly tituloListado: Locator;
  readonly tabla: Locator;
  readonly encabezados: Locator;
  readonly filas: Locator;
  readonly menuAcciones: Locator;

  constructor(page: Page) {
    super(page);
    this.titulo = page.getByRole('heading', { name: 'Asignar Auditorías del Plan Anual de Auditorías (PAA)', level: 2 });
    this.selectorVigencia = page.getByRole('combobox', { name: 'Seleccione una vigencia:' });
    this.tituloListado = page.getByRole('heading', { name: 'Listado de Auditorías Aprobadas en el Plan Anual de Auditorías (PAA)' });
    this.tabla = page.locator('plantilla-tarjeta-contenedora table').first();
    this.encabezados = this.tabla.getByRole('columnheader');
    this.filas = this.tabla.locator('tbody tr, tr[mat-row]');
    this.menuAcciones = page.getByRole('menu');
  }

  async abrir() {
    await this.abrirRuta('/gestion-auditoria/programacion/asignar-auditorias', this.selectorVigencia);
  }

  async elegirVigencia(vigencia: string) {
    await this.selectorVigencia.click();
    await this.page.getByRole('option', { name: vigencia, exact: true }).click();
  }

  /** Fila de la auditoría por su texto ("título – subtítulo"). */
  filaAuditoria(texto: string | RegExp): Locator {
    return this.filas.filter({ hasText: texto }).first();
  }

  /** Celdas de la columna (por nombre del encabezado) en las filas visibles. */
  async columna(nombre: string): Promise<string[]> {
    const encabezados = (await this.encabezados.allInnerTexts()).map((t) => t.trim());
    const indice = encabezados.indexOf(nombre);
    if (indice < 0) throw new Error(`la tabla de asignación no tiene la columna "${nombre}" (${encabezados.join(', ')})`);
    return (await this.filas.locator(`td:nth-child(${indice + 1})`).allInnerTexts()).map((t) => t.trim());
  }

  /** Abre el modal y espera los auditores asignados (llegan después de la lista de auditores de rol/periods). */
  async abrirAsignacion(fila: Locator): Promise<AsignarAuditorModal> {
    await fila.locator('td:last-child button').click();
    const asignados = this.page.waitForResponse((r) => /\/v1\/auditor\?query=auditoria_id:/.test(decodeURIComponent(r.url())), { timeout: 120_000 });
    await this.menuAcciones.getByRole('menuitem', { name: /Asignar Auditor\(es\)$/ }).click();
    const modal = new AsignarAuditorModal(this.page);
    await modal.esperarCarga();
    await asignados;
    return modal;
  }
}

export class AsignarAuditorModal extends BasePage {
  readonly dialogo: Locator;
  readonly nombre: Locator;
  readonly complementario: Locator;
  readonly tipoEvaluacion: Locator;
  readonly botonAgregarAuditor: Locator;
  /** Una fila por auditor asignado: selector, "Auditor Lider", desasignar y eliminar. */
  readonly filasAuditor: Locator;
  readonly botonGuardar: Locator;
  readonly botonCerrar: Locator;

  constructor(page: Page) {
    super(page);
    this.dialogo = page.getByRole('dialog').filter({ hasText: 'Edición de Auditoría' });
    this.nombre = this.dialogo.getByRole('textbox', { name: 'Nombre de Auditoría' });
    this.complementario = this.dialogo.getByRole('textbox', { name: 'Nombre complementario' });
    this.tipoEvaluacion = this.dialogo.getByRole('textbox', { name: 'Tipo de Evaluación' });
    this.botonAgregarAuditor = this.dialogo.getByRole('button', { name: 'Agregar Auditor' });
    this.filasAuditor = this.dialogo.locator('[formgroupname], .row > div.col-12.d-flex').filter({ has: page.getByRole('checkbox', { name: 'Auditor Lider' }) });
    this.botonGuardar = this.dialogo.getByRole('button', { name: 'Si, guardar y cerrar' });
    this.botonCerrar = this.dialogo.getByRole('button', { name: 'No, cerrar' });
  }

  async esperarCarga() {
    await expect(this.dialogo).toBeVisible({ timeout: 90_000 });
    await expect(this.nombre).not.toHaveValue('', { timeout: 90_000 });
  }

  selectorAuditor(indice: number): Locator {
    return this.filasAuditor.nth(indice).getByRole('combobox');
  }

  checkLider(indice: number): Locator {
    return this.filasAuditor.nth(indice).getByRole('checkbox', { name: 'Auditor Lider' });
  }

  /** Auditores que ofrece el selector de la fila (lo abre y lo cierra). */
  async auditoresDisponibles(indice: number): Promise<string[]> {
    await this.selectorAuditor(indice).click();
    const textos = await this.page.getByRole('listbox').getByRole('option').allInnerTexts();
    await this.page.keyboard.press('Escape');
    return textos.map((t) => t.trim()).filter(Boolean);
  }

  async elegirAuditor(indice: number, nombre: string) {
    await this.selectorAuditor(indice).click();
    await this.page.getByRole('option', { name: nombre, exact: true }).click();
  }

  /** Nombre del auditor elegido en la fila. */
  async auditorElegido(indice: number): Promise<string> {
    return (await this.selectorAuditor(indice).innerText()).trim();
  }

  /** Nombres de los auditores de las filas, en orden. */
  async auditoresAsignados(): Promise<string[]> {
    const nombres: string[] = [];
    for (let i = 0; i < (await this.filasAuditor.count()); i++) nombres.push(await this.auditorElegido(i));
    return nombres;
  }

  /** Fila del auditor por su nombre. */
  filaDe(nombre: string): Locator {
    return this.filasAuditor.filter({ hasText: nombre }).first();
  }

  /** "Desasignar auditor" de la fila (pide confirmación). */
  async desasignar(nombre: string) {
    await this.filaDe(nombre).getByRole('button', { name: 'Desasignar auditor' }).click();
  }

  /** Lista "Auditores Desasignados": cada uno con su botón "Reasignar auditor". */
  get desasignados(): Locator {
    return this.dialogo.locator('.auditores-lista .auditor-item');
  }

  async nombresDesasignados(): Promise<string[]> {
    return (await this.desasignados.locator('.auditor-nombre').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }

  async reasignar(nombre: string) {
    await this.desasignados.filter({ hasText: nombre }).getByRole('button', { name: 'Reasignar auditor' }).click();
  }

  async cerrar() {
    await this.botonCerrar.click();
    await expect(this.dialogo).toBeHidden();
  }
}
