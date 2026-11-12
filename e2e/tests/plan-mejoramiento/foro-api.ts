/**
 * Apoyo de los escenarios @escritura del foro (#948): limpieza por la API del CRUD
 * (borrado lógico de `comentario-accion`). Solo se tocan los comentarios con el marcador E2E.
 */
import { type APIRequestContext, type Page } from '@playwright/test';

/**
 * CRUD contra el que corre el escenario @escritura: el local (el mismo que usa el MF compilado con `local`).
 * El de pruebas desplegado no tiene `comentario-accion` hasta que se despliegue #948.
 */
const CRUD = (process.env['E2E_CRUD_URL'] || 'http://localhost:8080').replace(/\/$/, '');

export { marcadorE2E } from '../programacion/limpieza';

export interface ComentarioCrud {
  _id: string;
  mensaje: string;
  activo: boolean;
}

export class ApiForo {
  private ultimoToken = '';

  constructor(
    private readonly request: APIRequestContext,
    private readonly page: Page,
  ) {}

  /** Token de la página; si el root le cerró la sesión, el último leído (la limpieza debe correr igual). */
  private async autorizacion(): Promise<string> {
    try {
      const token = await this.page.evaluate(() => localStorage.getItem('access_token'));
      if (token) this.ultimoToken = token;
    } catch {
      if (!this.ultimoToken) throw new Error('la página no tiene sesión (access_token)');
    }
    return `Bearer ${this.ultimoToken}`;
  }

  private async llamar(metodo: 'GET' | 'DELETE', url: string) {
    const r = await this.request.fetch(url, { method: metodo, headers: { Authorization: await this.autorizacion() } });
    if (!r.ok()) throw new Error(`${metodo} ${new URL(url).pathname} → ${r.status()}`);
    return r.json();
  }

  /** Comentarios activos de la acción (todos, para poder separar los de E2E de los ajenos). */
  async activos(accionId: string): Promise<ComentarioCrud[]> {
    const r = await this.llamar('GET', `${CRUD}/comentario-accion?query=accion_mejora_id:${accionId},activo:true&limit=0`);
    return r?.Data ?? [];
  }

  async activosE2E(accionId: string): Promise<ComentarioCrud[]> {
    return (await this.activos(accionId)).filter((c) => String(c.mensaje).startsWith('E2E-'));
  }

  async borrar(comentarioId: string) {
    await this.llamar('DELETE', `${CRUD}/comentario-accion/${comentarioId}`);
  }

  /** Pre-limpieza: deja la acción sin comentarios de E2E de corridas interrumpidas. Lo ajeno no se toca. */
  async liberarAccion(accionId: string) {
    for (const comentario of await this.activosE2E(accionId)) await this.borrar(comentario._id);
  }
}
