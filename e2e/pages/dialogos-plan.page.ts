/**
 * Diálogos del PAA que se abren desde el listado o desde Ver Auditorias: Ver documentos
 * (ModalVerDocumentosComponent, pestañas por documento) e Historial de observaciones.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';

export class DocumentosDialog extends BasePage {
  readonly dialogo: Locator;
  readonly descripcion: Locator;
  readonly botonDescargarTodo: Locator;
  readonly botonActualizar: Locator;
  readonly botonRegresar: Locator;
  /** Visor del documento seleccionado. */
  readonly visor: Locator;

  constructor(page: Page) {
    super(page);
    this.dialogo = page.getByRole('dialog').filter({ hasText: 'Ver documentos' });
    this.descripcion = this.dialogo.getByText(/Documentos asociados al Plan Anual de Auditoría/);
    this.botonDescargarTodo = this.dialogo.getByRole('button', { name: 'Descargar Todo' });
    this.botonActualizar = this.dialogo.getByRole('button', { name: 'Actualizar Documento' });
    this.botonRegresar = this.dialogo.getByRole('button', { name: 'Regresar' });
    this.visor = this.dialogo.locator('iframe, embed, object, pdf-viewer, ngx-extended-pdf-viewer, canvas').first();
  }

  async esperarCarga() {
    await expect(this.dialogo).toBeVisible({ timeout: 60_000 });
    await expect(this.botonRegresar).toBeVisible();
  }

  /** Pestañas de documentos: todos los botones del diálogo menos las acciones. */
  async pestanas(): Promise<string[]> {
    const acciones = ['Descargar Todo', 'Actualizar Documento', 'Regresar'];
    const textos = await this.dialogo.getByRole('button').allInnerTexts();
    return textos.map((t) => t.split('\n').pop()!.trim()).filter((t) => t && !acciones.includes(t));
  }

  async elegirPestana(nombre: string) {
    await this.dialogo.getByRole('button', { name: nombre, exact: true }).click();
  }

  async cerrar() {
    await this.botonRegresar.click();
    await expect(this.dialogo).toBeHidden();
  }
}

export interface ObservacionPlan {
  rechazo: boolean;
  revisadoPor: string;
  rol: string;
  fecha: Date | null;
}

export class HistorialObservacionesDialog extends BasePage {
  readonly dialogo: Locator;
  readonly descripcion: Locator;
  readonly cargando: Locator;
  readonly botonRegresar: Locator;

  constructor(page: Page) {
    super(page);
    this.dialogo = page.getByRole('dialog').filter({ hasText: 'Historial de observaciones' });
    this.descripcion = this.dialogo.getByText(/Historial de observaciones - Plan Anual de Auditoría/);
    this.cargando = this.dialogo.getByRole('progressbar');
    this.botonRegresar = this.dialogo.getByRole('button', { name: 'Regresar' });
  }

  async esperarCarga() {
    await expect(this.dialogo).toBeVisible({ timeout: 60_000 });
    await expect(this.cargando).toBeHidden({ timeout: 60_000 });
  }

  /** Observaciones en el orden en que se muestran (modal-historial-rechazos: un chip por observación). */
  async observaciones(): Promise<ObservacionPlan[]> {
    const items = this.dialogo.locator('.fondo-chip--rechazo, .fondo-chip--revision');
    const lista: ObservacionPlan[] = [];
    for (const item of await items.all()) {
      const texto = (await item.innerText()).replace(/\s+/g, ' ');
      const fecha = texto.match(/Fecha:\s*(\d{2})\/(\d{2})\/(\d{4})/);
      lista.push({
        rechazo: ((await item.getAttribute('class')) ?? '').includes('fondo-chip--rechazo'),
        revisadoPor: texto.match(/Revisado por:\s*(.+?)\s+(?:person|Rol:)/)?.[1]?.trim() ?? '',
        rol: texto.match(/Rol:\s*(\S+)/)?.[1] ?? '',
        fecha: fecha ? new Date(Number(fecha[3]), Number(fecha[2]) - 1, Number(fecha[1])) : null,
      });
    }
    return lista;
  }

  async cerrar() {
    await this.botonRegresar.click();
    await expect(this.dialogo).toBeHidden();
  }
}
