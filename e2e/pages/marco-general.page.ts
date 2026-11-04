/**
 * Programación › Marco General del PAA (registrar-plan.component): vista de solo lectura
 * (`plan-auditoria/ver/:id`) y edición (`plan-auditoria/editar/:id`, formulario dinámico).
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';

export const SECCIONES_MARCO = ['Objetivo', 'Alcance', 'Criterios', 'Recursos'] as const;
export type SeccionMarco = (typeof SECCIONES_MARCO)[number];

export class MarcoGeneralPage extends BasePage {
  readonly titulo: Locator;
  readonly subtitulo: Locator;
  readonly botonRegresar: Locator;
  readonly botonGuardar: Locator;

  constructor(page: Page) {
    super(page);
    this.titulo = page.getByRole('heading', { name: 'Marco General del Plan Anual de Auditorías', level: 2 });
    this.subtitulo = page.locator('plantilla-tarjeta-contenedora').getByText(/Vigencia \d{4}/).first();
    this.botonRegresar = page.getByRole('button', { name: 'Regresar' });
    this.botonGuardar = page.getByRole('button', { name: 'Guardar', exact: true });
  }

  async esperarCarga() {
    await expect(this.titulo).toBeVisible({ timeout: 60_000 });
  }

  /** En modo lectura, cada sección es un encabezado h3 seguido de su párrafo. */
  seccion(nombre: SeccionMarco): Locator {
    return this.page.getByRole('heading', { name: nombre, level: 3 });
  }

  async textoSeccion(nombre: SeccionMarco): Promise<string> {
    return this.seccion(nombre).locator('xpath=following-sibling::p[1]').innerText();
  }

  /** Campos editables del formulario (en modo lectura no hay ninguno). */
  get camposEditables(): Locator {
    return this.page.locator('plantilla-tarjeta-contenedora').locator('textarea, input:not([type=hidden])');
  }

  async regresar() {
    await this.botonRegresar.click();
  }

  /** En edición, el campo de la sección (formulario dinámico: textarea con la etiqueta de la sección). */
  campo(nombre: SeccionMarco): Locator {
    return this.page.getByRole('textbox', { name: nombre, exact: true });
  }
}
