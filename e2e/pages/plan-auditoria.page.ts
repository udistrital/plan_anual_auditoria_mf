/**
 * Programación › Plan Anual de Auditoría: listado de PAA por vigencia, creación y menú de acciones
 * de cada plan (consulta-plan-auditoria.component).
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';

export class PlanAuditoriaPage extends BasePage {
  readonly titulo: Locator;
  readonly selectorVigencia: Locator;
  readonly botonCrear: Locator;
  readonly tabla: Locator;
  readonly encabezados: Locator;
  readonly filas: Locator;
  readonly rangoPaginador: Locator;
  readonly menuAcciones: Locator;

  constructor(page: Page) {
    super(page);
    this.titulo = page.getByRole('heading', { name: 'Plan Anual de Auditorías (PAA)', level: 2 });
    this.selectorVigencia = page.getByRole('combobox', { name: 'Seleccione el año del PAA:' });
    this.botonCrear = page.getByRole('button', { name: 'Crear PAA' });
    this.tabla = page.locator('plantilla-tarjeta-contenedora table[mat-table]');
    this.encabezados = this.tabla.getByRole('columnheader');
    this.filas = this.tabla.locator('tr[mat-row]');
    this.rangoPaginador = page.locator('mat-paginator .mat-mdc-paginator-range-label');
    this.menuAcciones = page.getByRole('menu');
  }

  async abrir() {
    await this.abrirRuta('/gestion-auditoria/programacion/plan-auditoria', this.filas.first());
  }

  /** Celdas de la columna (por nombre del encabezado) en las filas visibles. */
  async columna(nombre: string): Promise<string[]> {
    const encabezados = (await this.encabezados.allInnerTexts()).map((t) => t.trim());
    const indice = encabezados.indexOf(nombre);
    if (indice < 0) throw new Error(`la tabla de planes no tiene la columna "${nombre}" (${encabezados.join(', ')})`);
    return (await this.filas.locator(`td:nth-child(${indice + 1})`).allInnerTexts()).map((t) => t.trim());
  }

  /** Total de planes según el paginador ("1 – 5 de 19" → 19). */
  async total(): Promise<number> {
    const texto = await this.rangoPaginador.innerText();
    const total = Number(texto.match(/de\s+(\d+)/)?.[1]);
    if (!Number.isFinite(total)) throw new Error(`no se entiende el paginador: "${texto}"`);
    return total;
  }

  /**
   * Cambia los planes por página y espera a que la tabla crezca. No se compara con el total del
   * paginador: ese total también cuenta los planes borrados lógicamente, que la tabla no muestra.
   */
  async cambiarTamanoPagina(tamano: number) {
    const antes = await this.filas.count();
    // El touch-target de Material tapa el selector "Elementos por página:": se hace clic en él.
    await this.page.locator('mat-paginator .mat-mdc-paginator-touch-target').click();
    await this.page.getByRole('option', { name: String(tamano), exact: true }).click();
    if (Math.min(tamano, await this.total()) > antes) await expect.poll(() => this.filas.count()).toBeGreaterThan(antes);
  }

  /**
   * Fila del plan de la vigencia. Recorre las páginas si hace falta (el listado viene ordenado por
   * vigencia descendente, 5 por página). Con `estado`, solo una fila en ese estado.
   */
  async filaDeVigencia(vigencia: string, estado?: RegExp | string): Promise<Locator> {
    const fila = this.filas
      .filter({ has: this.page.locator('td', { hasText: new RegExp(`^\\s*${vigencia}\\s*$`) }) })
      .filter(estado ? { hasText: estado } : {})
      .first();
    for (let pagina = 0; pagina < 10; pagina++) {
      if (await fila.isVisible()) return fila;
      const siguiente = this.page.getByRole('button', { name: /Siguiente página|Next page/ });
      if (await siguiente.isDisabled()) break;
      const primera = await this.filas.first().innerText();
      await siguiente.click();
      await expect(this.filas.first()).not.toHaveText(primera);
    }
    throw new Error(`no hay un plan de la vigencia ${vigencia}${estado ? ` en estado ${estado}` : ''} en el listado`);
  }

  /** Abre el menú de acciones de la fila (botón sin nombre accesible: el único de la celda Acciones). */
  async abrirAcciones(fila: Locator): Promise<string[]> {
    await fila.locator('td:last-child button').click();
    await expect(this.menuAcciones).toBeVisible();
    return (await this.menuAcciones.getByRole('menuitem').allInnerTexts()).map((t) => t.split('\n').pop()!.trim());
  }

  async elegirAccion(nombre: string) {
    await this.menuAcciones.getByRole('menuitem', { name: new RegExp(`${nombre}$`) }).click();
  }

  async cerrarAcciones() {
    await this.page.keyboard.press('Escape');
    await expect(this.menuAcciones).toBeHidden();
  }

  /** Abre el menú de la vigencia y elige la acción. */
  async accionDeVigencia(vigencia: string, accion: string, estado?: RegExp) {
    const fila = await this.filaDeVigencia(vigencia, estado);
    await this.abrirAcciones(fila);
    await this.elegirAccion(accion);
  }

  /** Elige la vigencia del selector de creación (opciones de Parámetros, que pueden tardar en llegar). */
  async elegirVigenciaNueva(vigencia: string) {
    // Las vigencias llegan de Parámetros después de los roles y pueden tardar más que la tabla. Mientras
    // el selector no tiene opciones no abre: se reintenta abrirlo hasta que aparezca la vigencia.
    const opcion = this.page.getByRole('listbox').getByRole('option', { name: vigencia, exact: true });
    await expect(async () => {
      if (!(await opcion.isVisible())) {
        await this.page.keyboard.press('Escape');
        await this.selectorVigencia.locator('xpath=ancestor::mat-form-field[1]').click();
      }
      await expect(opcion).toBeVisible({ timeout: 3_000 });
    }, `el selector de vigencias no ofrece ${vigencia} (¿falló la consulta a Parámetros?)`).toPass({ timeout: 60_000 });
    await opcion.click();
  }

  /** Crea el PAA de la vigencia y devuelve su `_id` (POST plan-auditoria). La alerta la atiende quien llama. */
  async crearPlan(vigencia: string): Promise<string> {
    await this.elegirVigenciaNueva(vigencia);
    const creado = this.page.waitForResponse(
      (r) => r.request().method() === 'POST' && /\/plan_anual_auditoria_crud\/v1\/plan-auditoria$/.test(new URL(r.url()).pathname),
    );
    await this.botonCrear.click();
    const respuesta = await creado;
    const cuerpo = await respuesta.json().catch(() => ({}));
    if (!cuerpo?.Data?._id) throw new Error(`no se creó el PAA de ${vigencia}: ${cuerpo?.Message ?? cuerpo?.Data ?? respuesta.status()}`);
    return cuerpo.Data._id;
  }

  /**
   * Fila del plan creado hoy en la vigencia. Puede haber filas inactivas de la misma vigencia (el
   * listado no filtra `activo`, ver specs/programacion.plan.md), así que se busca también por la fecha.
   */
  async filaDeHoy(vigencia: string): Promise<Locator> {
    // "Hoy" según el navegador: la tabla formatea la fecha (pipe date dd/MM/yyyy) con su zona horaria.
    const hoy = await this.page.evaluate(() => {
      const d = new Date();
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    });
    // En los @escritura el listado llega completo y sin planes borrados (ocultarPlanesBorrados).
    return this.filaDeVigencia(vigencia, hoy);
  }

  /** Abre el menú del plan creado hoy y elige la acción. */
  async accionDePlanDeHoy(vigencia: string, accion: string) {
    await this.abrir();
    await this.abrirAcciones(await this.filaDeHoy(vigencia));
    await this.elegirAccion(accion);
  }
}
