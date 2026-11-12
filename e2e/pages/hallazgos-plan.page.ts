/**
 * Plan de mejoramiento › Formulación de planes › Registrar plan: tabla de hallazgos y resumen de cumplimiento
 * (registrar-plan + tabla-hallazgos).
 * Ruta: /gestion-auditoria/plan-mejoramiento/registrar-plan/:auditoriaId
 */
import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { BasePage } from '../core/base.page';

export const RUTA_REGISTRAR_PLAN = '/gestion-auditoria/plan-mejoramiento/registrar-plan';

/** Consulta de hallazgos de un informe, tanto de la tabla (paginada) como del resumen (limit=0). */
const CONSULTA_HALLAZGOS = /\/hallazgo\?query=informe_id:[0-9a-f]{24}/;

export class HallazgosPlanPage extends BasePage {
  /** Título de la pantalla: «Editar Plan de Mejoramiento» o «Ver Plan de Mejoramiento» según si el plan es editable. */
  readonly titulo: Locator;
  /** Filas de hallazgo (fila de grupo: una sola celda que ocupa toda la tabla). */
  readonly filasHallazgo: Locator;
  /** «(X de N hallazgos con acciones)» del resumen de cumplimiento. */
  readonly resumen: Locator;

  constructor(page: Page) {
    super(page);
    this.titulo = page.getByRole('heading', { name: /(Editar|Ver) Plan de Mejoramiento/, level: 2 });
    this.filasHallazgo = page.locator('tr.mat-mdc-row').filter({ has: page.locator('td[colspan]') });
    this.resumen = page.locator('small').filter({ hasText: /hallazgos con acciones/ });
  }

  /**
   * Abre Registrar plan de la auditoría y devuelve las respuestas de las consultas de hallazgos que hizo la
   * pantalla (la de la tabla y la del resumen), para comprobar con qué filtro las pidió.
   */
  async abrir(auditoriaId: string): Promise<Response[]> {
    const respuestas: Response[] = [];
    const escuchar = (r: Response) => {
      if (r.request().method() === 'GET' && CONSULTA_HALLAZGOS.test(r.url())) respuestas.push(r);
    };
    this.page.on('response', escuchar);
    await this.abrirRuta(`${RUTA_REGISTRAR_PLAN}/${auditoriaId}`, this.titulo);
    await expect.poll(() => respuestas.length, { message: 'la tabla y el resumen consultan hallazgos', timeout: 60_000 }).toBeGreaterThanOrEqual(2);
    this.page.off('response', escuchar);
    return respuestas;
  }

  /** Total «N» que muestra el resumen de cumplimiento (undefined si no se muestra). */
  async totalEnResumen(): Promise<number | undefined> {
    if (!(await this.resumen.count())) return undefined;
    const texto = await this.resumen.first().innerText();
    const m = texto.match(/\((\d+) de (\d+) hallazgos con acciones\)/);
    return m ? Number(m[2]) : undefined;
  }
}
