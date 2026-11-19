/**
 * Gestión Auditoría › Auditorías externas (#953): listado por vigencia (auditorias-externas +
 * tabla-auditorias-externas) y registro en una sola pantalla (editar-auditoria, sin stepper).
 * Rutas: /gestion-auditoria/auditorias-externas y .../auditorias-externas/registrar-auditoria
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';

export class AuditoriasExternasPage extends BasePage {
  // Listado
  readonly selectorVigencia: Locator;
  readonly botonCrear: Locator;
  readonly tituloListado: Locator;
  readonly filas: Locator;
  readonly avisoSinAuditorias: Locator;

  // Registro
  readonly seccionInformacion: Locator;
  readonly seccionInforme: Locator;
  readonly seccionHallazgos: Locator;
  readonly stepper: Locator;
  readonly inputInforme: Locator;
  readonly botonContinuar: Locator;
  readonly botonCancelar: Locator;

  constructor(page: Page) {
    super(page);
    this.selectorVigencia = page.getByRole('combobox', { name: 'Seleccione una vigencia:' });
    this.botonCrear = page.getByRole('button', { name: 'Crear', exact: true });
    this.tituloListado = page.getByRole('heading', { name: 'Listado de Auditorías Externas' });
    this.filas = page.locator('app-tabla-auditorias-externas tr[mat-row]');
    this.avisoSinAuditorias = page.getByText('No hay auditorías externas registradas.');

    this.seccionInformacion = page.locator('#seccion-informacion');
    this.seccionInforme = page.locator('#seccion-informe');
    this.seccionHallazgos = page.locator('#seccion-hallazgos');
    this.stepper = page.locator('mat-stepper');
    // El input de archivo está oculto: se le entrega el archivo sin abrir el selector del sistema
    this.inputInforme = page.locator('#seccion-informe input[type=file]');
    this.botonContinuar = page.getByRole('button', { name: 'Continuar', exact: true });
    this.botonCancelar = page.getByRole('button', { name: 'Cancelar', exact: true });
  }

  async abrirListado() {
    await this.abrirRuta('/gestion-auditoria/auditorias-externas', this.selectorVigencia);
  }

  async abrirRegistro() {
    await this.abrirRuta('/gestion-auditoria/auditorias-externas/registrar-auditoria', this.seccionInformacion);
  }

  async elegirVigencia(vigencia: string) {
    await this.selectorVigencia.click();
    await this.page.getByRole('option', { name: vigencia, exact: true }).click();
  }

  /** Espera el listado del MID y la tabla que muestra lo que trajo (o el aviso de vacío). */
  async esperarListado() {
    const respuesta = await this.page.waitForResponse(
      (r) => r.request().method() === 'GET' && /\/auditoria-externa\?/.test(r.url()),
    );
    expect(respuesta.status(), 'el listado de auditorías externas debería responder 200').toBe(200);
    const cuerpo = await respuesta.json();
    const total = (cuerpo?.Data ?? []).length as number;
    if (total === 0) await expect(this.avisoSinAuditorias).toBeVisible();
    else await expect(this.filas).toHaveCount(total);
    return total;
  }

  titulosDeSeccion(): Locator {
    return this.page.locator('section.seccion-registro h2');
  }

  async adjuntarInforme(rutaArchivo: string) {
    await this.inputInforme.setInputFiles(rutaArchivo);
  }

  async pulsarContinuar() {
    await this.botonContinuar.click();
  }

  /** Mensajes de la alerta "No es posible continuar" (uno por pendiente). */
  async pendientesDeLaAlerta(): Promise<string> {
    await expect(this.alerta).toBeVisible();
    return this.textoAlerta();
  }
}
