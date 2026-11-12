/**
 * Datos de los escenarios de formulación del plan (ver specs/formulacion-dependencias-hallazgos.plan.md, #947).
 * En pruebas (06/11/2026) la cuenta del jefe de dependencia no tiene planes en Creando con hallazgos, así que se
 * usa un plan existente con hallazgos y acciones y se simula (simularGet) que está en Creando para ver la tabla
 * en modo edición. Las escrituras siguen bloqueadas (@lectura): nada se guarda.
 */
import type { Page } from '@playwright/test';

/** Auditoría cuyo plan se abre en Registrar plan (E2E_AUDITORIA_FORMULACION); en pruebas: plan 2026 con 8 hallazgos. */
export const AUDITORIA_FORMULACION = process.env['E2E_AUDITORIA_FORMULACION'] || '69e2590193bc8b882dc8269e';

/** AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.CREANDO_PLAN_MEJORAMIENTO del environment de pruebas (E2E_ESTADO_CREANDO). */
export const ESTADO_CREANDO = Number(process.env['E2E_ESTADO_CREANDO'] || 7082);

/** GET del plan de la auditoría (no el de plan-mejoramiento-auditor ni el de formulación). */
export const GET_PLAN = /\/plan-mejoramiento\?query=auditoria_id(:|%3A)/;

/** ¿Es el GET de las acciones que carga la tabla (por hallazgos de la página, no el resumen con fields)? */
export const esGetAccionesTabla = (url: string) => {
  const u = decodeURIComponent(url);
  return /\/accion-mejora\?query=plan_mejoramiento_id:/.test(u) && u.includes('hallazgo_id__in') && !u.includes('fields=');
};

/** ¿Es el GET de los hallazgos de la página de la tabla? */
export const esGetHallazgosTabla = (url: string) => {
  const u = decodeURIComponent(url);
  return /\/hallazgo\?query=informe_id:/.test(u) && !u.includes('fields=');
};

/** ¿Es el GET de los responsables de las acciones que carga la tabla? */
export const esGetResponsablesTabla = (url: string) =>
  /\/responsable-accion\?query=accion_mejora_id__in:/.test(decodeURIComponent(url));

/**
 * Simula que la auditoría (GET MID auditoria/:id, cuyo Data es un objeto) tiene estas dependencias.
 * `simularGet` del core solo reescribe Data de tipo lista, por eso se usa page.route aquí. @simulado.
 */
export async function simularDependenciasAuditoria(page: Page, auditoriaId: string, dependencias: number[]) {
  await page.route(new RegExp(`/auditoria/${auditoriaId}(\\?|$)`), async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    const respuesta = await route.fetch();
    // Si el gateway responde algo que no es JSON (p. ej. un error XML de WSO2), se entrega tal cual
    const cuerpo = await respuesta.json().catch(() => null);
    if (!cuerpo) return route.fulfill({ response: respuesta });
    if (cuerpo.Data && !Array.isArray(cuerpo.Data)) cuerpo.Data = { ...cuerpo.Data, dependencia_id: dependencias };
    await route.fulfill({ response: respuesta, json: cuerpo });
  });
}

/** Marca el plan como en Creando para que Registrar plan quede en modo edición. */
export const planEnCreando = (data: any) =>
  Array.isArray(data) ? data.map((plan) => ({ ...plan, estado_id: ESTADO_CREANDO })) : data;
