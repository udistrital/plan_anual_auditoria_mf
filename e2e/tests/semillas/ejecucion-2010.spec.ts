// spec: e2e/specs/estabilizacion-ejecucion.plan.md
/**
 * Semilla de Ejecución y Planeación en la vigencia de E2E (D8 de sisifo_documentacion#940).
 *
 * Crea por la API del CRUD dos auditorías especiales (padre sin PAA + concreta) con el auditor de
 * pruebas asignado. NO se limpian: son los datos fijos de los escenarios @lectura de Ejecución y
 * Planeación. Es idempotente: lo que ya existe no se vuelve a crear. El prefijo `SEMILLA-E2E` no lo
 * borra la pre-limpieza de Programación (`liberarEspeciales` solo borra `E2E-…`) y, sin PAA, tampoco
 * choca con `liberarVigencia`.
 */
import { type APIRequestContext } from '@playwright/test';
import { test, expect } from '../../core/fixtures';
import { environment } from '../../../src/environments/environment.development';
import { VIGENCIA_E2E } from '../programacion/datos';
import { ApiProgramacion, personaDe, tokenDe } from '../programacion/limpieza';
import { SEMILLA_INICIAR_EJECUCION, SEMILLA_RESUMEN_HALLAZGOS } from '../ejecucion/datos';

const CRUD = environment.PLAN_ANUAL_AUDITORIA_SERVICE.replace(/\/$/, '');
const { PLANEACION, EJECUCION } = environment.AUDITORIA_ESTADO;

class ApiSemilla {
  constructor(private readonly request: APIRequestContext, private readonly token: string) {}

  private async llamar(metodo: 'GET' | 'POST', ruta: string, body?: object) {
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
  async function auditoria(semilla: { titulo: string; consecutivo: string }, estados: number[]) {
    const [padre] = await api.listar(`auditoria-padre?query=vigencia_id:${vigenciaId},titulo:${encodeURIComponent(semilla.titulo)},activo:true&limit=1`);
    let padreId = padre?._id;
    if (!padreId) {
      // Dependencia, macroproceso y proceso reales, para que las tablas los muestren con nombre.
      const [referencia] = await api.listar(`auditoria-padre?query=tipo_evaluacion_id:${environment.TIPO_EVALUACION.AUDITORIA_INTERNA_ID},activo:true&limit=1`);
      padreId = (await api.crear('auditoria-padre', {
        titulo: semilla.titulo,
        tipo_evaluacion_id: environment.TIPO_EVALUACION.AUDITORIA_INTERNA_ID,
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
      for (const estado_id of estados) {
        const fase_id = estado_id >= EJECUCION.POR_EJECUTAR ? environment.AUDITORIA_FASE.EJECUCION_PRELIMINAR : environment.AUDITORIA_FASE.PLANEACION;
        await api.crear('auditoria-estado', { auditoria_id: hijaId, estado_id, fase_id, usuario_id: asignadoPor, usuario_rol: environment.ROL.AUDITOR_EXPERTO, observacion: 'Semilla E2E' });
      }
      creado.push(`historial de ${semilla.consecutivo} hasta ${estados.at(-1)}`);
    }
    return hijaId as string;
  }

  await test.step('auditoría con preinforme en revisión del Jefe, con hallazgos (resumen de hallazgos)', async () => {
    const s = SEMILLA_RESUMEN_HALLAZGOS;
    const auditoriaId = await auditoria(s, [PLANEACION.APROBADO_PROGRAMA_AUDITADO, EJECUCION.POR_EJECUTAR, EJECUCION.CREANDO_PREINFORME, EJECUCION.REVISION_PREINFORME_JEFE]);

    const [informe] = await api.listar(`informe?query=auditoria_id:${auditoriaId},activo:true&limit=1`);
    const informeId = informe?._id ?? (await api.crear('informe', { auditoria_id: auditoriaId }))._id;
    if (!informe) creado.push('informe');

    let [tema] = await api.listar(`tema?query=informe_id:${informeId},activo:true&limit=1`);
    if (!tema) {
      tema = await api.crear('tema', { informe_id: informeId, titulo: s.tema });
      creado.push('tema');
    }
    let subtema = (tema.subtema ?? []).find((sub: any) => sub.activo !== false);
    if (!subtema) {
      const conSubtema = await api.crear('subtema', { tema_id: tema._id, titulo: s.subtema });
      subtema = (conSubtema?.subtema ?? []).at(-1);
      creado.push('subtema');
    }

    const existentes = await api.listar(`hallazgo?query=informe_id:${informeId},activo:true&limit=0`);
    for (const h of s.hallazgos.filter((h) => !existentes.some((e) => e.titulo === h.titulo))) {
      await api.crear('hallazgo', { auditoria_id: auditoriaId, informe_id: informeId, subtema_id: subtema._id, ...h });
      creado.push(`hallazgo "${h.titulo}"`);
    }
  });

  await test.step('auditoría con el programa aprobado por el auditado (iniciar ejecución)', async () => {
    await auditoria(SEMILLA_INICIAR_EJECUCION, [PLANEACION.CREANDO_PROGRAMA, PLANEACION.APROBADO_PROGRAMA_JEFE, PLANEACION.APROBADO_PROGRAMA_AUDITADO]);
  });

  await testInfo.attach('creado en esta corrida', { body: creado.join('\n') || 'nada: la semilla ya existía', contentType: 'text/plain' });
});
