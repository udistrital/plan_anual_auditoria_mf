/**
 * Escenarios @escritura de Programación: marcador, correos interceptados y limpieza de lo que crean
 * en la vigencia de E2E (borrado lógico por la API del CRUD, D24/D25 de la especificación).
 *
 * La limpieza definitiva de la vigencia la hará un script del líder (D29); mientras tanto el listado de
 * planes sigue mostrando los planes borrados lógicamente.
 */
import { type APIRequestContext, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { environment } from '../../../src/environments/environment.development';

const CRUD = environment.PLAN_ANUAL_AUDITORIA_SERVICE.replace(/\/$/, '');
const PARAMETROS = environment.PARAMETROS_SERVICE.replace(/\/$/, '');
const NOTIFICACIONES = environment.NOTIFICACIONES_MID_SERVICE.replace(/\/$/, '');

/** Marcador de lo que crea una corrida (E2E-AAAAMMDD-HHmm). */
export function marcadorE2E(fecha = new Date()): string {
  const d = (n: number) => String(n).padStart(2, '0');
  return `E2E-${fecha.getFullYear()}${d(fecha.getMonth() + 1)}${d(fecha.getDate())}-${d(fecha.getHours())}${d(fecha.getMinutes())}`;
}

/** Token de la sesión que la aplicación está usando en la página (siempre vigente mientras la página viva). */
export async function tokenDe(page: Page): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  if (!token) throw new Error('la página no tiene sesión (access_token)');
  return token;
}

/** Tercero (persona_id) de la cuenta con sesión en la página. */
export async function personaDe(page: Page): Promise<number | undefined> {
  const id = Number(await page.evaluate(() => localStorage.getItem('persona_id')));
  return Number.isFinite(id) && id > 0 ? id : undefined;
}

export class ApiProgramacion {
  private ultimoToken = '';

  constructor(
    private readonly request: APIRequestContext,
    private readonly token: () => Promise<string>,
  ) {}

  /**
   * Token de la página; si el root le cerró la sesión (la página ya no existe), el último que se leyó.
   * Así la limpieza del final corre aunque el escenario falle por la sesión (el token dura ~60 min).
   */
  private async autorizacion(): Promise<string> {
    try {
      this.ultimoToken = await this.token();
    } catch (error) {
      if (!this.ultimoToken) throw error;
    }
    return `Bearer ${this.ultimoToken}`;
  }

  private async llamar(metodo: 'GET' | 'DELETE', url: string) {
    const r = await this.request.fetch(url, { method: metodo, headers: { Authorization: await this.autorizacion() } });
    if (!r.ok()) throw new Error(`${metodo} ${new URL(url).pathname} → ${r.status()}`);
    return r.json();
  }

  async idVigencia(nombre: string): Promise<number> {
    const r = await this.llamar('GET', `${PARAMETROS}/parametro?query=TipoParametroId:121,Nombre:${nombre}&fields=Id,Nombre&limit=0`);
    const id = r?.Data?.[0]?.Id;
    if (!id) throw new Error(`no existe la vigencia ${nombre} en Parámetros`);
    return id;
  }

  async planesActivos(vigenciaId: number): Promise<any[]> {
    return (await this.llamar('GET', `${CRUD}/plan-auditoria?query=vigencia_id:${vigenciaId},activo:true&limit=0`))?.Data ?? [];
  }

  /**
   * Antes de empezar: la vigencia de E2E debe estar libre. Un plan activo que dejó otra corrida se borra:
   * el que tiene el marcador E2E en el objetivo, o el que la misma cuenta creó y quedó sin marco (corrida
   * interrumpida antes de llenarlo). Uno de otra persona NO se toca y el escenario falla con un mensaje claro.
   */
  async liberarVigencia(vigencia: string, personaId?: number) {
    const vigenciaId = await this.idVigencia(vigencia);
    for (const plan of await this.planesActivos(vigenciaId)) {
      const objetivo = String(plan.objetivo ?? '');
      const sinMarcoPropio = !objetivo && personaId !== undefined && Number(plan.creado_por_id) === personaId;
      if (!objetivo.startsWith('E2E-') && !sinMarcoPropio) {
        throw new Error(
          `la vigencia ${vigencia} tiene un PAA activo que no es de E2E (${plan._id}); no se toca. ` +
            'Elige otra vigencia con E2E_PROG_VIGENCIA_E2E o acuerda con el equipo.',
        );
      }
      await this.borrarPlan(plan._id);
    }
  }

  /** Auditorías concretas (hijas) activas del plan. */
  async auditoriasDelPlan(planId: string): Promise<any[]> {
    return (await this.llamar('GET', `${CRUD}/auditoria?query=plan_auditoria_id:${planId},activo:true&limit=0`))?.Data ?? [];
  }

  /** Documentos activos registrados para el plan (Formato PAA, actas, matriz). */
  async documentosDelPlan(planId: string): Promise<any[]> {
    return (await this.llamar('GET', `${CRUD}/documento?query=referencia_id:${planId},activo:true&limit=0`))?.Data ?? [];
  }

  /** Historial de estados del plan, del más antiguo al más reciente. */
  async estadosDelPlan(planId: string): Promise<any[]> {
    const estados = (await this.llamar('GET', `${CRUD}/estado?query=plan_auditoria_id:${planId}&limit=0`))?.Data ?? [];
    return estados.sort((a: any, b: any) => String(a.fecha_creacion).localeCompare(String(b.fecha_creacion)));
  }

  /** Registros de auditor activos de la auditoría (asignados y desasignados). */
  async auditoresDe(auditoriaId: string): Promise<any[]> {
    return (await this.llamar('GET', `${CRUD}/auditor?query=auditoria_id:${auditoriaId},activo:true&limit=0`))?.Data ?? [];
  }

  /** Estado actual de la auditoría concreta (`auditoria-estado`, `actual:true`). */
  async estadoActualAuditoria(auditoriaId: string): Promise<number | undefined> {
    return (await this.llamar('GET', `${CRUD}/auditoria-estado?query=auditoria_id:${auditoriaId},actual:true&limit=0`))?.Data?.[0]?.estado_id;
  }

  /** Auditorías concretas activas de una auditoría padre (especiales). */
  async concretasDe(padreId: string): Promise<any[]> {
    return (await this.llamar('GET', `${CRUD}/auditoria?query=auditoria_padre_id:${padreId},activo:true&limit=0`))?.Data ?? [];
  }

  /**
   * Antes de empezar: borra las auditorías especiales de E2E (título con marcador) que dejó otra corrida
   * en la vigencia. Las de otras personas no se tocan.
   */
  async liberarEspeciales(vigencia: string): Promise<number> {
    const vigenciaId = await this.idVigencia(vigencia);
    const padres = (await this.llamar('GET', `${CRUD}/auditoria-padre?query=vigencia_id:${vigenciaId},activo:true&limit=0`))?.Data ?? [];
    const deE2E = padres.filter((p: any) => !p.plan_auditoria_id && String(p.titulo ?? '').startsWith('E2E-'));
    for (const padre of deE2E) await this.borrarEspecial(padre._id);
    return deE2E.length;
  }

  /** Borrado lógico del plan y de lo que cuelga de él: asignaciones, auditorías hijas y padres. */
  async borrarPlan(planId: string): Promise<string[]> {
    const hecho: string[] = [];
    const hijas = (await this.llamar('GET', `${CRUD}/auditoria?query=plan_auditoria_id:${planId},activo:true&limit=0`))?.Data ?? [];
    for (const hija of hijas) {
      const auditores = (await this.llamar('GET', `${CRUD}/auditor?query=auditoria_id:${hija._id},activo:true&limit=0`))?.Data ?? [];
      for (const a of auditores) await this.llamar('DELETE', `${CRUD}/auditor/${a._id}`);
      await this.llamar('DELETE', `${CRUD}/auditoria/${hija._id}`);
      hecho.push(`auditoría ${hija._id} (${auditores.length} asignaciones)`);
    }
    const padres = (await this.llamar('GET', `${CRUD}/auditoria-padre?query=plan_auditoria_id:${planId},activo:true&limit=0`))?.Data ?? [];
    for (const padre of padres) await this.llamar('DELETE', `${CRUD}/auditoria-padre/${padre._id}`);
    hecho.push(`${padres.length} auditorías padre`);
    await this.llamar('DELETE', `${CRUD}/plan-auditoria/${planId}`);
    hecho.push(`plan ${planId}`);
    return hecho;
  }

  /** Borrado lógico de una auditoría especial (padre) y de sus concretas. */
  async borrarEspecial(padreId: string) {
    const hijas = (await this.llamar('GET', `${CRUD}/auditoria?query=auditoria_padre_id:${padreId},activo:true&limit=0`))?.Data ?? [];
    for (const hija of hijas) {
      const auditores = (await this.llamar('GET', `${CRUD}/auditor?query=auditoria_id:${hija._id},activo:true&limit=0`))?.Data ?? [];
      for (const a of auditores) await this.llamar('DELETE', `${CRUD}/auditor/${a._id}`);
      await this.llamar('DELETE', `${CRUD}/auditoria/${hija._id}`);
    }
    await this.llamar('DELETE', `${CRUD}/auditoria-padre/${padreId}`);
  }
}

/**
 * El listado de planes del MID también trae los planes borrados lógicamente (D29), y cada corrida deja
 * uno más de la vigencia de E2E con la fecha de hoy. Mientras llega el script de limpieza del líder, en
 * los escenarios @escritura se quitan del listado (solo en el navegador de la prueba) para que la fila
 * de la vigencia sea la del plan de la corrida. La observación sigue reportada en la issue.
 */
export async function ocultarPlanesBorrados(contexto: BrowserContext) {
  await contexto.route(/plan_anual_auditoria_mid\/v1\/plan-auditoria\?/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    // Sin paginar: el MID ordena solo por vigencia y, entre varias filas de la misma vigencia, el plan de
    // la corrida puede cambiar de página entre consultas.
    const url = new URL(route.request().url());
    url.searchParams.set('limit', '0');
    url.searchParams.set('offset', '0');
    const respuesta = await route.fetch({ url: url.toString(), timeout: 120_000 });
    const cuerpo = await respuesta.json();
    if (Array.isArray(cuerpo?.Data)) cuerpo.Data = cuerpo.Data.filter((plan: { activo?: boolean }) => plan.activo !== false);
    await route.fulfill({ response: respuesta, json: cuerpo });
  });
}

/**
 * Los correos van a destinatarios reales fijos (D23): se responden como enviados sin llegar al MID de
 * notificaciones, y cada payload queda en el reporte para verificar que se armó.
 */
export async function interceptarCorreos(contexto: BrowserContext, testInfo: TestInfo): Promise<string[]> {
  const correos: string[] = [];
  await contexto.route(`${NOTIFICACIONES}/**`, async (route) => {
    if (route.request().method() === 'GET') return route.fallback();
    const cuerpo = route.request().postData() ?? '';
    correos.push(`${new URL(route.request().url()).pathname} ${cuerpo.slice(0, 400)}`);
    await testInfo.attach(`correo interceptado ${correos.length}`, { body: cuerpo, contentType: 'application/json' });
    return route.fulfill({ status: 200, json: { Success: true, Status: 200, Message: 'interceptado por E2E', Data: {} } });
  });
  return correos;
}

/**
 * Próxima subida de un documento al gestor documental (Nuxeo, `gestor_documental_mid/document/…`):
 * su status y cuánto tardó. Un status 0 indica que no hubo respuesta (se cortó o falló la red).
 */
export async function esperarSubidaGestor(page: Page, timeout = 6 * 60_000): Promise<{ status: number; segundos: number }> {
  const inicio = Date.now();
  const segundos = () => Math.round((Date.now() - inicio) / 1000);
  const peticion = await page.waitForRequest((r) => r.method() === 'POST' && /gestor_documental_mid\/v1\/document\//.test(r.url()), { timeout });
  // response() espera la respuesta, o devuelve null si la petición falla; el límite cubre la que nunca responde.
  let limite: NodeJS.Timeout | undefined;
  const status = await Promise.race([
    peticion.response().then((r) => r?.status() ?? 0).catch(() => 0),
    new Promise<number>((resolve) => (limite = setTimeout(() => resolve(0), Math.max(timeout - (Date.now() - inicio), 1_000)))),
  ]);
  clearTimeout(limite);
  return { status, segundos: segundos() };
}

