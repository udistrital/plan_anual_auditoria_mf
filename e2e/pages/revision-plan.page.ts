/**
 * Programación › Revisión del PAA por el Jefe OCI (revision-jefe.component) y por el Secretario
 * (revision-secretario.component), con el modal de rechazo (modal-motivos-rechazo) y el de
 * aprobación con el Acta de CCCI (modal-aprobacion-secretario).
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';

export type Revisor = 'jefe' | 'secretario';

const APROBAR: Record<Revisor, string> = { jefe: 'Aprobar y enviar a Secretario', secretario: 'Aprobar' };

export class RevisionPlanPage extends BasePage {
  readonly titulo: Locator;
  readonly botonRegresar: Locator;
  readonly botonDescargarTodo: Locator;
  readonly pestanaOriginal: Locator;
  /** Documento renderizado (el PDF del Formato PAA Original). */
  readonly documento: Locator;
  readonly botonRechazar: Locator;
  readonly botonAprobar: Locator;

  constructor(page: Page, readonly revisor: Revisor) {
    super(page);
    this.titulo = page.getByRole('heading', { name: 'Aprobación Plan Anual de Auditoría', level: 2 });
    this.botonRegresar = page.getByRole('button', { name: 'Regresar' });
    this.botonDescargarTodo = page.getByRole('button', { name: 'Descargar Todo' });
    this.pestanaOriginal = page.getByRole('button', { name: 'Formato PAA Original' });
    this.documento = page.getByRole('region').filter({ hasText: 'PLAN ANUAL DE AUDITORÍA (PAA)' }).first();
    // "Rechazar plan" (Jefe) y "Rechazar Plan" (Secretario)
    this.botonRechazar = page.getByRole('button', { name: /^Rechazar plan$/i });
    this.botonAprobar = page.getByRole('button', { name: APROBAR[revisor], exact: true });
  }

  async esperarCarga() {
    await expect(this.page).toHaveURL(new RegExp(`/plan-auditoria/revision-${this.revisor}/[0-9a-f]{24}$`));
    await expect(this.titulo).toBeVisible({ timeout: 60_000 });
    await expect(this.documento).toBeVisible({ timeout: 90_000 });
  }

  async abrirRechazo(): Promise<RechazoDialog> {
    await this.botonRechazar.click();
    const dialogo = new RechazoDialog(this.page);
    await expect(dialogo.dialogo).toBeVisible();
    return dialogo;
  }

  async abrirAprobacionSecretario(): Promise<ActaComiteDialog> {
    await this.botonAprobar.click();
    const dialogo = new ActaComiteDialog(this.page);
    await expect(dialogo.dialogo).toBeVisible();
    return dialogo;
  }
}

export class RechazoDialog extends BasePage {
  readonly dialogo: Locator;
  readonly motivos: Locator;
  readonly errores: Locator;
  readonly botonRechazar: Locator;
  readonly botonRegresar: Locator;

  constructor(page: Page) {
    super(page);
    this.dialogo = page.getByRole('dialog').filter({ hasText: 'Motivos del rechazo' });
    this.motivos = this.dialogo.getByRole('textbox', { name: 'Motivos del rechazo' });
    this.errores = this.dialogo.locator('mat-error');
    this.botonRechazar = this.dialogo.getByRole('button', { name: 'Si, rechazar' });
    this.botonRegresar = this.dialogo.getByRole('button', { name: 'No, regresar' });
  }

  async cerrar() {
    await this.botonRegresar.click();
    await expect(this.dialogo).toBeHidden();
  }
}

export class ActaComiteDialog extends BasePage {
  readonly dialogo: Locator;
  readonly archivo: Locator;
  readonly botonAprobar: Locator;
  readonly botonCerrar: Locator;

  constructor(page: Page) {
    super(page);
    this.dialogo = page.getByRole('dialog').filter({ hasText: 'Adjuntar Acta de CCCI' });
    this.archivo = this.dialogo.locator('input[type=file]');
    this.botonAprobar = this.dialogo.getByRole('button', { name: 'Si, aprobar' });
    this.botonCerrar = this.dialogo.getByRole('button', { name: 'No, cerrar' });
  }

  async adjuntar(ruta: string) {
    await this.archivo.setInputFiles(ruta);
  }

  async cerrar() {
    await this.botonCerrar.click();
    await expect(this.dialogo).toBeHidden();
  }
}
