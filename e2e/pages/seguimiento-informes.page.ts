/**
 * Ejecución › Seguimiento e Informes (seguimiento-informes + tabla-seguimientos) y el informe de seguimiento
 * (editar-informe-seguimiento: stepper de 4 pasos; el 3 es Aspectos Evaluados, aspectos-evaluados-seguimiento).
 * Rutas: /gestion-auditoria/ejecucion/seguimiento-informes y .../editar-informe/:id
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';

export class SeguimientoInformesPage extends BasePage {
  readonly selectorVigencia: Locator;
  readonly filas: Locator;
  readonly menuAcciones: Locator;

  constructor(page: Page) {
    super(page);
    this.selectorVigencia = page.getByRole('combobox', { name: 'Seleccione una vigencia:' });
    this.filas = page.locator('app-tabla-seguimientos table').first().locator('tbody tr, tr[mat-row]');
    this.menuAcciones = page.getByRole('menu');
  }

  async abrir() {
    await this.abrirRuta('/gestion-auditoria/ejecucion/seguimiento-informes', this.selectorVigencia);
  }

  async elegirVigencia(vigencia: string) {
    await this.selectorVigencia.click();
    await this.page.getByRole('option', { name: vigencia, exact: true }).click();
  }

  /** Fila del seguimiento por su título. */
  filaSeguimiento(texto: string | RegExp): Locator {
    return this.filas.filter({ hasText: texto }).first();
  }

  /** Abre el menú de la fila y elige la acción ("Editar Informe", "Ver Informe", …). */
  async accion(fila: Locator, nombre: string) {
    await fila.locator('td:last-child button').click();
    await expect(this.menuAcciones).toBeVisible();
    await this.menuAcciones.getByRole('menuitem', { name: new RegExp(`${nombre}$`) }).click();
  }
}

export class InformeSeguimientoPage extends BasePage {
  readonly pasoAspectos: Locator;
  readonly aspectos: Locator;
  readonly temas: Locator;
  readonly botonAgregarTema: Locator;
  readonly botonGuardarYContinuar: Locator;

  constructor(page: Page) {
    super(page);
    this.pasoAspectos = page.getByRole('tab', { name: /Aspectos Evaluados/ });
    this.aspectos = page.locator('app-aspectos-evaluados-seguimiento');
    // Cada tema es un nodo del árbol de aspectos evaluados (no tiene nombre accesible propio)
    this.temas = this.aspectos.locator('.tree > .tree-node');
    this.botonAgregarTema = this.aspectos.getByRole('button', { name: 'Agregar Tema' });
    this.botonGuardarYContinuar = page.getByRole('button', { name: 'Guardar y Continuar' });
  }

  async esperarCarga() {
    await expect(this.page).toHaveURL(/\/ejecucion\/seguimiento-informes\/editar-informe\//, { timeout: 60_000 });
    await expect(this.pasoAspectos).toBeVisible({ timeout: 60_000 });
  }

  async irAAspectos() {
    await this.pasoAspectos.click();
    await expect(this.aspectos).toBeVisible({ timeout: 60_000 });
  }

  /** Agrega un tema con su nombre y una imagen en la descripción, con el botón de imagen del editor. */
  async agregarTemaConImagen(nombre: string, imagen: { name: string; mimeType: string; buffer: Buffer }) {
    await this.botonAgregarTema.click();
    const tema = this.temas.last();
    await tema.getByLabel('Nombre del Tema').fill(nombre);
    const selector = this.page.waitForEvent('filechooser');
    await tema.locator('quill-editor button.ql-image').click();
    await (await selector).setFiles(imagen);
    await expect(tema.locator('quill-editor .ql-editor img')).toHaveCount(1);
  }

  /** "Guardar y Continuar" del paso 3, aceptando la confirmación. */
  async guardarAspectos() {
    await this.botonGuardarYContinuar.click();
    await this.confirmarAlerta();
  }
}
