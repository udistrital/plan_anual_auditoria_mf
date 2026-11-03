/**
 * Programación › Registro Auditorías Especiales (registro-auditorias-especiales + tabla-auditorias-especiales):
 * auditorías padre sin PAA y, al expandir cada una, sus auditorías concretas.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';

export class AuditoriasEspecialesPage extends BasePage {
  readonly titulo: Locator;
  readonly selectorVigencia: Locator;
  readonly botonCrear: Locator;
  readonly tituloListado: Locator;
  readonly tabla: Locator;
  readonly encabezados: Locator;
  /** Filas de auditorías padre (las que tienen el botón de expandir). */
  readonly filasPadre: Locator;
  readonly menuAcciones: Locator;

  constructor(page: Page) {
    super(page);
    this.titulo = page.getByRole('heading', { name: 'Registro Auditorías Especiales', level: 2 });
    this.selectorVigencia = page.getByRole('combobox', { name: 'Seleccione una vigencia:' });
    this.botonCrear = page.getByRole('button', { name: 'Crear Auditoría Especial' });
    this.tituloListado = page.getByRole('heading', { name: 'Listado de Auditorías Especiales Registradas' });
    this.tabla = page.locator('plantilla-tarjeta-contenedora table').first();
    this.encabezados = this.tabla.getByRole('columnheader');
    // Por CSS y no por rol: tras cerrar un modal y su alerta, el <main> del root queda con aria-hidden
    // (hallazgo reportado en sisifo_documentacion#939) y getByRole deja de encontrar las filas.
    this.filasPadre = this.tabla.locator('tr[mat-row]:not(.fila-auditoria-concreta)');
    this.menuAcciones = page.getByRole('menu');
  }

  async abrir() {
    await this.abrirRuta('/gestion-auditoria/programacion/auditorias-especiales', this.selectorVigencia);
  }

  async elegirVigencia(vigencia: string) {
    await this.selectorVigencia.click();
    await this.page.getByRole('option', { name: vigencia, exact: true }).click();
  }

  filaPadre(titulo: string | RegExp): Locator {
    return this.filasPadre.filter({ hasText: titulo }).first();
  }

  /** Filas de auditorías concretas visibles (se insertan debajo de su padre al expandir). */
  readonly filasConcretas = this.page.locator('tr.fila-auditoria-concreta');

  /** Expande la fila padre: el botón pasa a "Colapsar auditorías concretas". */
  async expandir(fila: Locator) {
    const boton = fila.locator('button.btn-expandir');
    await expect(boton).toHaveAttribute('aria-label', 'Expandir auditorías concretas');
    await boton.click();
    await expect(boton).toHaveAttribute('aria-label', 'Colapsar auditorías concretas', { timeout: 60_000 });
  }

  async abrirAcciones(fila: Locator): Promise<string[]> {
    await fila.locator('td:last-child button').click();
    await expect(this.menuAcciones).toBeVisible();
    return (await this.menuAcciones.getByRole('menuitem').allInnerTexts()).map((t) => t.split('\n').pop()!.trim());
  }

  /** Abre el menú de la fila y elige la acción ("Editar Auditoría Especial", "Generar una Auditoría", …). */
  async accion(fila: Locator, nombre: string) {
    await this.abrirAcciones(fila);
    await this.menuAcciones.getByRole('menuitem', { name: new RegExp(`${nombre}$`) }).click();
  }

  /**
   * "Crear Auditoría Especial" en la vigencia elegida: crea una auditoría padre vacía ("Sin Titulo") y
   * devuelve su `_id` (POST auditoria-gestion responde con su estado inicial). Las alertas las atiende quien llama.
   */
  async crear(): Promise<string> {
    const creada = this.page.waitForResponse(
      (r) => r.request().method() === 'POST' && /\/plan_anual_auditoria_crud\/v1\/auditoria-gestion$/.test(new URL(r.url()).pathname),
      { timeout: 90_000 },
    );
    await this.botonCrear.click();
    await expect(this.alerta).toBeVisible();
    await this.confirmarAlerta();
    const cuerpo = await (await creada).json().catch(() => ({}));
    const id = cuerpo?.Data?.auditoria_padre_id;
    if (!id) throw new Error(`no se creó la auditoría especial: ${cuerpo?.Message ?? JSON.stringify(cuerpo?.Data)}`);
    return id;
  }

  /** Filas de auditorías concretas desplegadas. */
  get concretasVisibles(): Locator {
    return this.filasConcretas.filter({ visible: true });
  }
}
