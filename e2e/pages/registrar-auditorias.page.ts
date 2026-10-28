/**
 * Programación › Auditorías del PAA (registrar-auditorias.component): en solo lectura ("Ver
 * Auditorias") y en edición ("Registrar Auditorías", plan en Borrador o Rechazado), con el modal
 * de crear/editar auditoría (add-auditoria-modal.component).
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';

export class RegistrarAuditoriasPage extends BasePage {
  readonly titulo: Locator;
  readonly tabla: Locator;
  readonly encabezados: Locator;
  readonly filas: Locator;
  readonly botonRegresar: Locator;
  // Solo lectura
  readonly botonVerDocumentos: Locator;
  readonly botonExportar: Locator;
  // Edición
  readonly botonAnadir: Locator;
  readonly botonCargueMasivo: Locator;
  readonly botonVer: Locator;
  readonly botonGuardar: Locator;
  readonly botonDescargarPlantilla: Locator;

  constructor(page: Page) {
    super(page);
    this.titulo = page.getByRole('heading', { name: 'Auditorías del Plan Anual de Auditoría (PAA)', level: 2 });
    this.tabla = page.locator('plantilla-tarjeta-contenedora table').first();
    this.encabezados = this.tabla.getByRole('columnheader');
    this.filas = this.tabla.locator('tbody tr, tr[mat-row]');
    this.botonRegresar = page.getByRole('button', { name: 'Regresar' });
    this.botonVerDocumentos = page.getByRole('button', { name: 'Ver Documentos' });
    this.botonExportar = page.getByRole('button', { name: /Exportar tabla/i });
    this.botonAnadir = page.getByRole('button', { name: 'Añadir Auditoría' });
    this.botonCargueMasivo = page.getByRole('button', { name: 'Cargue Masivo' });
    this.botonVer = page.getByRole('button', { name: 'Ver', exact: true });
    this.botonGuardar = page.getByRole('button', { name: 'Guardar', exact: true });
    this.botonDescargarPlantilla = page.getByRole('button', { name: 'Descargar Plantilla' });
  }

  async esperarCarga() {
    await expect(this.titulo).toBeVisible({ timeout: 60_000 });
    await expect(this.filas.first()).toBeVisible({ timeout: 60_000 });
  }

  async nombresEncabezados(): Promise<string[]> {
    return (await this.encabezados.allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }

  /**
   * Descarga del botón "Exportar tabla" (consulta el MID y arma el xlsx en el navegador). Si la
   * aplicación muestra su alerta de error (p. ej. la consulta al MID falló), falla de inmediato con ese texto.
   */
  async exportar() {
    const descarga = this.page.waitForEvent('download', { timeout: 90_000 });
    await this.botonExportar.click();
    const resultado = await Promise.race([
      descarga,
      this.alerta.filter({ hasText: 'Error' }).waitFor({ timeout: 90_000 }).then(() => null),
    ]);
    if (!resultado) throw new Error(`la aplicación no exportó la tabla: "${await this.textoAlerta()}"`);
    return resultado;
  }

  async abrirNuevaAuditoria(): Promise<AuditoriaModal> {
    await this.botonAnadir.click();
    const modal = new AuditoriaModal(this.page);
    await expect(modal.dialogo).toBeVisible();
    return modal;
  }
}

/** Campos del modal por su `formControlName` (las etiquetas visibles se repiten: "Seleccionar"). */
const CAMPOS = {
  nombre: 'tituloActividad',
  tipoEvaluacion: 'tipoEvaluacion',
  macroprocesos: 'macroprocesos',
  procesos: 'procesos',
  cronograma: 'cronogramaActividades',
} as const;
export type CampoAuditoria = keyof typeof CAMPOS;

export class AuditoriaModal extends BasePage {
  readonly dialogo: Locator;
  readonly nombre: Locator;
  readonly dependencias: Locator;
  readonly cantidad: Locator;
  readonly errores: Locator;
  readonly botonGuardar: Locator;
  readonly botonCerrar: Locator;

  constructor(page: Page) {
    super(page);
    this.dialogo = page.getByRole('dialog').filter({ hasText: 'Añadir Auditoría al Plan Anual de Auditoría' });
    this.nombre = this.dialogo.getByRole('textbox', { name: 'Nombre de Auditoría' });
    this.dependencias = this.dialogo.getByRole('combobox', { name: 'Dependencias' });
    this.cantidad = this.dialogo.getByRole('combobox', { name: 'Cantidad de Auditorías' });
    this.errores = this.dialogo.locator('mat-error');
    this.botonGuardar = this.dialogo.getByRole('button', { name: 'Si, guardar y cerrar' });
    this.botonCerrar = this.dialogo.getByRole('button', { name: 'No, cerrar' });
  }

  selector(campo: Exclude<CampoAuditoria, 'nombre'>): Locator {
    return this.dialogo.locator(`mat-select[formcontrolname="${CAMPOS[campo]}"]`);
  }

  async deshabilitado(campo: Exclude<CampoAuditoria, 'nombre'>): Promise<boolean> {
    return (await this.selector(campo).getAttribute('aria-disabled')) === 'true';
  }

  /** Abre el panel del selector. El mat-select vacío lo tapa su etiqueta: se hace clic en su mat-form-field. */
  private async abrirSelector(campo: Exclude<CampoAuditoria, 'nombre'>) {
    await this.selector(campo).locator('xpath=ancestor::mat-form-field[1]').click();
  }

  /** Opciones del selector (lo abre y lo cierra). Un selector deshabilitado o sin panel no tiene opciones. */
  async opciones(campo: Exclude<CampoAuditoria, 'nombre'>): Promise<string[]> {
    if (await this.deshabilitado(campo)) return [];
    await this.abrirSelector(campo);
    const panel = this.page.getByRole('listbox');
    if (!(await panel.isVisible())) return [];
    const textos = await panel.getByRole('option').allInnerTexts();
    await this.page.keyboard.press('Escape');
    return textos.map((t) => t.trim()).filter(Boolean);
  }

  /** Marca las opciones (selectores múltiples) o la opción (simples) y cierra el panel. */
  async elegir(campo: Exclude<CampoAuditoria, 'nombre'>, ...nombres: string[]) {
    await this.abrirSelector(campo);
    for (const nombre of nombres) await this.page.getByRole('option', { name: nombre, exact: true }).click();
    if (await this.page.getByRole('listbox').isVisible()) await this.page.keyboard.press('Escape');
  }

  async valor(campo: Exclude<CampoAuditoria, 'nombre'>): Promise<string> {
    return (await this.selector(campo).innerText()).trim();
  }

  /** Opciones marcadas en el panel del selector (lo abre y lo cierra). */
  async seleccionadas(campo: Exclude<CampoAuditoria, 'nombre'>): Promise<string[]> {
    await this.abrirSelector(campo);
    const textos = await this.page.getByRole('listbox').getByRole('option', { selected: true }).allInnerTexts();
    await this.page.keyboard.press('Escape');
    return textos.map((t) => t.trim()).filter(Boolean);
  }

  async textosError(): Promise<string[]> {
    return (await this.errores.allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }

  async cerrar() {
    await this.botonCerrar.click();
    await expect(this.dialogo).toBeHidden();
  }
}
