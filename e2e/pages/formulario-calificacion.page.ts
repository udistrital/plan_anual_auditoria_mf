/**
 * Formulario de calificación del auditor (app-formulario-calificacion): porcentaje, criterio de
 * evaluación con sugerencia según el porcentaje, y análisis de seguimiento.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';

export class FormularioCalificacion extends BasePage {
  readonly raiz: Locator;
  readonly porcentaje: Locator;
  readonly analisis: Locator;
  readonly botonCalificar: Locator;
  readonly botonCancelar: Locator;
  readonly errores: Locator;
  readonly criterioSeleccionado: Locator;
  readonly avisoCoherencia: Locator;

  constructor(page: Page) {
    super(page);
    this.raiz = page.locator('app-formulario-calificacion');
    this.porcentaje = this.raiz.getByRole('spinbutton', { name: 'Porcentaje de avance' });
    this.analisis = this.raiz.getByLabel('Análisis de seguimiento');
    this.botonCalificar = page.getByRole('button', { name: 'Calificar' });
    this.botonCancelar = page.getByRole('button', { name: 'Cancelar' });
    this.errores = this.raiz.locator('.error-campo');
    this.criterioSeleccionado = this.raiz.locator('.criterio-seleccionado .criterio-nombre');
    this.avisoCoherencia = this.raiz.locator('.coherencia');
  }

  criterio(nombre: string): Locator {
    return this.raiz.locator('label.criterio', { hasText: nombre });
  }

  async escribirPorcentaje(valor: number) {
    await this.porcentaje.fill(String(valor));
  }

  async elegirCriterio(nombre: string) {
    await this.criterio(nombre).click();
    await expect(this.criterioSeleccionado).toHaveText(nombre);
  }

  /** Nombre del elemento que tiene el foco (aria-label o id). */
  async campoConFoco(): Promise<string | null> {
    return this.page.evaluate(
      () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.id ?? null,
    );
  }
}
