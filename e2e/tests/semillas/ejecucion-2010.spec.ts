// spec: e2e/specs/estabilizacion-ejecucion.plan.md
/**
 * Semilla de Ejecución y Planeación en la vigencia de E2E (D8 de sisifo_documentacion#940).
 *
 * Crea por la API del CRUD auditorías especiales (padre sin PAA + concreta) con el auditor de pruebas
 * asignado. La semilla E sube además una descripción real al gestor documental (queda en Nuxeo).
 * NO se limpian: son los datos fijos de los escenarios @lectura de Ejecución y
 * Planeación. Es idempotente: lo que ya existe no se vuelve a crear. El prefijo `SEMILLA-E2E` no lo
 * borra la pre-limpieza de Programación (`liberarEspeciales` solo borra `E2E-…`) y, sin PAA, tampoco
 * choca con `liberarVigencia`.
 */
import { type APIRequestContext } from '@playwright/test';
import { test, expect } from '../../core/fixtures';
import { environment } from '../../../src/environments/environment.development';
import { VIGENCIA_E2E } from '../programacion/datos';
import { ApiProgramacion, personaDe, tokenDe } from '../programacion/limpieza';
import { SEMILLA_EDICION_INFORME, SEMILLA_INICIAR_EJECUCION, SEMILLA_PDF_IMAGEN, SEMILLA_RESUMEN_HALLAZGOS, SEMILLA_SEGUIMIENTO } from '../ejecucion/datos';
import { pngPatron } from '../ejecucion/gestor';

const CRUD = environment.PLAN_ANUAL_AUDITORIA_SERVICE.replace(/\/$/, '');
const GESTOR = environment.GESTOR_DOCUMENTAL_SERVICE.replace(/\/$/, '');
const { PLANEACION, EJECUCION } = environment.AUDITORIA_ESTADO;
const { AUDITORIA_INTERNA_ID, SEGUIMIENTO_ID } = environment.TIPO_EVALUACION;

type HallazgoSemilla = { criterio: string; titulo: string; descripcion: string };
/** `descripcionTema` puede ser una función: así la subida al gestor solo ocurre si el tema todavía no existe. */
type ContenidoInforme = { tema: string; descripcionTema?: string | (() => Promise<string>); subtema: string; hallazgos: HallazgoSemilla[] };

class ApiSemilla {
  constructor(private readonly request: APIRequestContext, private readonly token: string) {}

  private async llamar(metodo: 'GET' | 'POST' | 'PUT', ruta: string, body?: object) {
    const r = await this.request.fetch(`${CRUD}/${ruta}`, {
      method: metodo,
      headers: { Authorization: `Bearer ${this.token}` },
      data: body,
    });
    if (!r.ok()) throw new Error(`${metodo} ${ruta.split('?')[0]} → ${r.status()}: ${await r.text()}`);
    return (await r.json())?.Data;
  }

  listar = async (ruta: string): Promise<any[]> => (await this.llamar('GET', ruta)) ?? [];
  crear = (coleccion: string, body: object) => this.llamar('POST', coleccion, body);
  actualizar = (ruta: string, body: object) => this.llamar('PUT', ruta, body);
}

test('semilla: auditorías especiales de 2010 para los escenarios de Ejecución y Planeación', { tag: ['@semilla', '@auditor-experto', '@escritura'] }, async ({ page, request, comoRol }, testInfo) => {
  test.setTimeout(5 * 60_000);
  // El root deja persona_id en localStorage después de cargar: se espera a que aparezca.
  const personaCargada = async (p: typeof page) => {
    await p.goto('/');
    await expect.poll(() => personaDe(p), { message: 'la cuenta de prueba tiene persona_id', timeout: 60_000 }).toBeDefined();
    return (await personaDe(p))!;
  };
  const asignadoPor = await personaCargada(page);
  const api = new ApiSemilla(request, await tokenDe(page));
  const auditorId = await personaCargada(await comoRol('auditor'));
  const vigenciaId = await new ApiProgramacion(request, () => tokenDe(page)).idVigencia(VIGENCIA_E2E);
  const creado: string[] = [];

  /** Padre + concreta + auditor asignado + historial de estados; devuelve la concreta. */
  async function auditoria(semilla: { titulo: string; consecutivo: string }, estados: number[], tipoEvaluacion = AUDITORIA_INTERNA_ID) {
    const [padre] = await api.listar(`auditoria-padre?query=vigencia_id:${vigenciaId},titulo:${encodeURIComponent(semilla.titulo)},activo:true&limit=1`);
    let padreId = padre?._id;
    if (!padreId) {
      // Dependencia, macroproceso y proceso reales, para que las tablas los muestren con nombre.
      const [referencia] = await api.listar(`auditoria-padre?query=tipo_evaluacion_id:${AUDITORIA_INTERNA_ID},activo:true&limit=1`);
      padreId = (await api.crear('auditoria-padre', {
        titulo: semilla.titulo,
        tipo_evaluacion_id: tipoEvaluacion,
        vigencia_id: vigenciaId,
        dependencia_id: referencia?.dependencia_id ?? [],
        macroproceso_id: referencia?.macroproceso_id ?? [],
        proceso_id: referencia?.proceso_id ?? [],
        cantidad_auditorias: 1,
      }))._id;
      creado.push(`auditoria-padre ${semilla.titulo}`);
    }

    const [hija] = await api.listar(`auditoria?query=auditoria_padre_id:${padreId},activo:true&limit=1`);
    let hijaId = hija?._id;
    if (!hijaId) {
      hijaId = (await api.crear('auditoria', {
        auditoria_padre_id: padreId,
        vigencia_id: vigenciaId,
        consecutivo_OCI: semilla.consecutivo,
        objetivo: `${semilla.titulo}: dato fijo de las pruebas E2E, no modificar.`,
        activo: true,
      }))._id;
      creado.push(`auditoria ${semilla.consecutivo}`);
    }

    const auditores = await api.listar(`auditor?query=auditoria_id:${hijaId},auditor_id:${auditorId},activo:true&limit=0`);
    if (!auditores.length) {
      await api.crear('auditor', { auditoria_id: hijaId, auditor_id: auditorId, asignado: true, asignado_por_id: asignadoPor, auditor_lider: true, activo: true });
      creado.push(`auditor asignado a ${semilla.consecutivo}`);
    }

    const historial = await api.listar(`auditoria-estado?query=auditoria_id:${hijaId}&limit=0`);
    if (!historial.length) {
      // El seguimiento pasa directo al informe final (como iniciarEjecucion en Planeación)
      const faseEjecucion = tipoEvaluacion === SEGUIMIENTO_ID ? environment.AUDITORIA_FASE.EJECUCION_FINAL : environment.AUDITORIA_FASE.EJECUCION_PRELIMINAR;
      for (const estado_id of estados) {
        const fase_id = estado_id >= EJECUCION.POR_EJECUTAR ? faseEjecucion : environment.AUDITORIA_FASE.PLANEACION;
        await api.crear('auditoria-estado', { auditoria_id: hijaId, estado_id, fase_id, usuario_id: asignadoPor, usuario_rol: environment.ROL.AUDITOR_EXPERTO, observacion: 'Semilla E2E' });
      }
      creado.push(`historial de ${semilla.consecutivo} hasta ${estados.at(-1)}`);
    }
    return hijaId as string;
  }

  /** Informe de la auditoría (existente o nuevo); devuelve su _id. */
  async function informe(auditoriaId: string, consecutivo: string): Promise<string> {
    const [existente] = await api.listar(`informe?query=auditoria_id:${auditoriaId},activo:true&limit=1`);
    if (existente) return existente._id;
    creado.push(`informe de ${consecutivo}`);
    return (await api.crear('informe', { auditoria_id: auditoriaId }))._id;
  }

  /** Un tema (con descripción opcional), un subtema y sus hallazgos dentro del informe. */
  async function contenidoInforme(auditoriaId: string, informeId: string, c: ContenidoInforme) {
    let [tema] = await api.listar(`tema?query=informe_id:${informeId},activo:true&limit=1`);
    if (!tema) {
      const descripcion = typeof c.descripcionTema === 'function' ? await c.descripcionTema() : c.descripcionTema;
      tema = await api.crear('tema', { informe_id: informeId, titulo: c.tema, ...(descripcion ? { descripcion_titulo: descripcion } : {}) });
      creado.push(`tema "${c.tema}"`);
    }
    let subtema = (tema.subtema ?? []).find((sub: any) => sub.activo !== false);
    if (!subtema) {
      const conSubtema = await api.crear('subtema', { tema_id: tema._id, titulo: c.subtema });
      subtema = (conSubtema?.subtema ?? []).at(-1);
      creado.push(`subtema "${c.subtema}"`);
    }

    const existentes = await api.listar(`hallazgo?query=informe_id:${informeId},activo:true&limit=0`);
    for (const h of c.hallazgos.filter((h) => !existentes.some((e) => e.titulo === h.titulo))) {
      await api.crear('hallazgo', { auditoria_id: auditoriaId, informe_id: informeId, subtema_id: subtema._id, ...h });
      creado.push(`hallazgo "${h.titulo}"`);
    }
  }

  /**
   * Sube al gestor documental real (Nuxeo) el HTML de una descripción, con el mismo cuerpo que arma el MF
   * (aspectos-evaluados → subirHtmlANuxeo), y devuelve el valor que se guarda en el tema. El gestor no tiene
   * borrado: el documento queda en Nuxeo de pruebas (se informa en el reporte).
   */
  async function subirDescripcionAlGestor(html: string, nombre: string): Promise<string> {
    const base64 = Buffer.from(html, 'utf8').toString('base64');
    const r = await request.fetch(`${GESTOR}/document/uploadAnyFormat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await tokenDe(page)}` },
      data: [{ IdTipoDocumento: environment.TIPO_DOCUMENTO.INFORMES, nombre, descripcion: 'Descripción de tema (semilla E2E)', metadatos: {}, file: JSON.stringify(base64) }],
    });
    if (!r.ok()) throw new Error(`POST gestor document/uploadAnyFormat → ${r.status()}: ${(await r.text()).slice(0, 300)}`);
    const cuerpo = await r.json();
    const enlace = (Array.isArray(cuerpo?.res) ? cuerpo.res[0] : cuerpo?.res)?.Enlace;
    if (!enlace) throw new Error('el gestor no devolvió el enlace del documento');
    creado.push(`documento en Nuxeo ${enlace} (no se puede borrar)`);
    return `NuxeoEnlace:${enlace}`;
  }

  await test.step('auditoría con preinforme en revisión del Jefe, con hallazgos (resumen de hallazgos)', async () => {
    const s = SEMILLA_RESUMEN_HALLAZGOS;
    const auditoriaId = await auditoria(s, [PLANEACION.APROBADO_PROGRAMA_AUDITADO, EJECUCION.POR_EJECUTAR, EJECUCION.CREANDO_PREINFORME, EJECUCION.REVISION_PREINFORME_JEFE]);
    await contenidoInforme(auditoriaId, await informe(auditoriaId, s.consecutivo), s);
  });

  await test.step('auditoría con el preinforme en creación y un tema con descripción en Nuxeo (edición del informe)', async () => {
    const s = SEMILLA_EDICION_INFORME;
    const auditoriaId = await auditoria(s, [PLANEACION.APROBADO_PROGRAMA_AUDITADO, EJECUCION.POR_EJECUTAR, EJECUCION.CREANDO_PREINFORME]);
    await contenidoInforme(auditoriaId, await informe(auditoriaId, s.consecutivo), {
      tema: s.tema, descripcionTema: s.enlaceDescripcion, subtema: s.subtema, hallazgos: [s.hallazgo],
    });
  });

  await test.step('seguimiento con el informe final en creación y sin temas (edición del seguimiento)', async () => {
    const s = SEMILLA_SEGUIMIENTO;
    const auditoriaId = await auditoria(s, [PLANEACION.APROBADO_PROGRAMA_AUDITADO, EJECUCION.POR_EJECUTAR, EJECUCION.CREANDO_INFORME_FINAL], SEGUIMIENTO_ID);
    await informe(auditoriaId, s.consecutivo);
  });

  await test.step('auditoría con el programa aprobado por el auditado (iniciar ejecución)', async () => {
    await auditoria(SEMILLA_INICIAR_EJECUCION, [PLANEACION.CREANDO_PROGRAMA, PLANEACION.APROBADO_PROGRAMA_JEFE, PLANEACION.APROBADO_PROGRAMA_AUDITADO]);
  });

  await test.step('auditoría con el preinforme en creación y un tema con imagen guardada de verdad en Nuxeo (PDF del MID)', async () => {
    const s = SEMILLA_PDF_IMAGEN;
    const auditoriaId = await auditoria(s, [PLANEACION.APROBADO_PROGRAMA_AUDITADO, EJECUCION.POR_EJECUTAR, EJECUCION.CREANDO_PREINFORME]);
    const html = `<p>${s.textoDescripcion}</p><p><img src="data:image/png;base64,${pngPatron(s.imagen.ancho, s.imagen.alto)}" style="width:${s.imagen.ancho * 4}px;"></p>`;
    const informeId = await informe(auditoriaId, s.consecutivo);
    // El MID no genera el PDF sin fecha de emisión (la llena el paso 1, "Información"): se completa una sola vez
    const [actual] = await api.listar(`informe?query=_id:${informeId}&limit=1`);
    if (!actual?.fecha_emision) {
      await api.actualizar(`informe/${informeId}`, s.informe);
      creado.push(`paso 1 del informe de ${s.consecutivo} (fecha de emisión, muestra y aspectos generales)`);
    }
    await contenidoInforme(auditoriaId, informeId, {
      tema: s.tema, descripcionTema: () => subirDescripcionAlGestor(html, s.tema), subtema: s.subtema, hallazgos: [s.hallazgo],
    });
  });

  await testInfo.attach('creado en esta corrida', { body: creado.join('\n') || 'nada: la semilla ya existía', contentType: 'text/plain' });
});
