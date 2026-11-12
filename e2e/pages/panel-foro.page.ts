/**
 * Panel lateral "Foro de seguimiento" de la acción (#948): mensajes guardados por el MID
 * (GET/POST .../accion-mejora/:accionId/comentario), con «Actualizar», «Ver anteriores» y redacción
 * solo si el MID dice que la persona puede comentar.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../core/base.page';

const RUTA_COMENTARIOS = /\/accion-mejora\/[0-9a-f]{24}\/comentario(\?|$)/;

export class PanelForo extends BasePage {
  readonly dialogo: Locator;
  readonly titulo: Locator;
  readonly botonActualizar: Locator;
  readonly botonCerrar: Locator;
  readonly cargando: Locator;
  readonly mensajes: Locator;
  readonly vacio: Locator;
  readonly errorCarga: Locator;
  readonly botonVerAnteriores: Locator;
  readonly campo: Locator;
  readonly botonEnviar: Locator;
  readonly contador: Locator;
  readonly errorEnvio: Locator;
  readonly soloLectura: Locator;
  readonly avisoEnConstruccion: Locator;

  constructor(page: Page) {
    super(page);
    this.dialogo = page.locator('mat-dialog-container').filter({ has: page.locator('app-panel-foro-accion') });
    this.titulo = this.dialogo.getByRole('heading', { name: 'Foro de seguimiento' });
    this.botonActualizar = this.dialogo.getByRole('button', { name: 'Actualizar mensajes' });
    this.botonCerrar = this.dialogo.getByRole('button', { name: 'Cerrar' });
    this.cargando = this.dialogo.getByText('Cargando mensajes…');
    this.mensajes = this.dialogo.locator('.mensaje');
    this.vacio = this.dialogo.getByText('Aún no hay mensajes en el foro de esta acción.');
    this.errorCarga = this.dialogo.getByText('No se pudieron cargar los mensajes.');
    this.botonVerAnteriores = this.dialogo.getByRole('button', { name: /Ver anteriores/ });
    this.campo = this.dialogo.getByLabel('Nuevo mensaje');
    this.botonEnviar = this.dialogo.getByRole('button', { name: /Enviar/ });
    this.contador = this.dialogo.locator('.contador');
    this.errorEnvio = this.dialogo.locator('.error-envio');
    this.soloLectura = this.dialogo.getByText(/Solo lectura/);
    this.avisoEnConstruccion = this.dialogo.getByText(/Foro en construcción/);
  }

  /** Espera a que el panel abra y termine de leer los mensajes (con o sin ellos). */
  async esperarAbierto() {
    await expect(this.titulo).toBeVisible();
    await expect(this.cargando).toBeHidden({ timeout: 30_000 });
    await expect(this.errorCarga).toBeHidden();
  }

  /** Mensajes que tienen el texto indicado (el marcador de la corrida, por ejemplo). */
  mensajesCon(texto: string): Locator {
    return this.mensajes.filter({ hasText: texto });
  }

  /** Autor · rol · dependencia y fecha de un mensaje, en una sola línea. */
  async cabecera(mensaje: Locator): Promise<string> {
    return (await mensaje.locator('.mensaje-cabecera').innerText()).replace(/\s+/g, ' ').trim();
  }

  /** Escribe y envía el mensaje; devuelve el _id que el MID le dio (para limpiarlo después). */
  async enviar(texto: string): Promise<string> {
    await this.campo.fill(texto);
    const [respuesta] = await Promise.all([
      this.page.waitForResponse((r) => r.request().method() === 'POST' && RUTA_COMENTARIOS.test(r.url())),
      this.botonEnviar.click(),
    ]);
    expect(respuesta.status(), 'el MID debe responder 201 al publicar').toBe(201);
    return (await respuesta.json()).Data._id as string;
  }

  /** Pulsa «Actualizar» y espera la respuesta del MID. */
  async actualizar() {
    await Promise.all([
      this.page.waitForResponse((r) => r.request().method() === 'GET' && RUTA_COMENTARIOS.test(r.url())),
      this.botonActualizar.click(),
    ]);
  }

  /**
   * Responde la lectura del foro con `total` mensajes inventados, paginados como el MID (más recientes primero,
   * `limit` y `offset` de la URL) y con `puede_comentar` verdadero. No toca el backend: sirve para recorrer
   * «Ver anteriores» sin sembrar decenas de comentarios. Se registra antes de abrir el panel.
   */
  async simularLista(total: number) {
    const todos = Array.from({ length: total }, (_, i) => {
      const n = i + 1;
      return {
        _id: `${String(n).padStart(24, '0')}`,
        accion_mejora_id: '0'.repeat(24),
        mensaje: `Mensaje simulado ${String(n).padStart(2, '0')}`,
        fecha_creacion: new Date(Date.UTC(2026, 0, 1, 8, n)).toISOString(),
        usuario_id: 1,
        usuario_nombre: 'Persona Simulada',
        usuario_rol: 'AUDITOR',
        rol_nombre: 'Auditor',
        dependencia_id: null,
        dependencia_nombre: null,
      };
    }).reverse();
    await this.page.route(RUTA_COMENTARIOS, async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      const url = new URL(route.request().url());
      const limit = Number(url.searchParams.get('limit') ?? 20);
      const offset = Number(url.searchParams.get('offset') ?? 0);
      await route.fulfill({
        status: 200,
        headers: { 'access-control-allow-origin': '*' },
        json: {
          Success: true,
          Status: 200,
          Message: 'Peticion Exitosa',
          Data: todos.slice(offset, offset + limit),
          MetaData: { Count: total, puede_comentar: true },
        },
      });
    });
  }

  /**
   * Responde el envío (POST) con lo que devuelva `respuesta` en cada intento, sin llegar al backend ni al
   * bloqueo de escrituras del marco. Se registra antes de enviar.
   */
  async simularEnvio(respuesta: () => { status: number; cuerpo: object }) {
    await this.page.route(RUTA_COMENTARIOS, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      const { status, cuerpo } = respuesta();
      await route.fulfill({ status, headers: { 'access-control-allow-origin': '*' }, json: cuerpo });
    });
  }

  /**
   * Reescribe `MetaData.puede_comentar` de la lectura del foro (no escribe en el backend). Se registra antes
   * de abrir el panel. Las escrituras siguen pasando por el bloqueo del marco (`fallback`).
   */
  async simularPuedeComentar(valor: boolean) {
    await this.page.route(RUTA_COMENTARIOS, async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      const respuesta = await route.fetch();
      const cuerpo = await respuesta.json();
      cuerpo.MetaData = { ...cuerpo.MetaData, puede_comentar: valor };
      await route.fulfill({ response: respuesta, json: cuerpo });
    });
  }
}
