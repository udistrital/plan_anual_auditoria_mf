/**
 * Datos semilla de los escenarios de Programación (ver specs/programacion.plan.md).
 * Lectura: un PAA aprobado con observaciones, rechazos y modificaciones. Escritura: una vigencia
 * dedicada a E2E. Las dos se cambian por variable si el ambiente cambia.
 */
import { environment } from '../../../src/environments/environment.development';

/** PAA aprobado por el Comité, con observaciones, rechazos y ediciones extraordinarias. */
export const VIGENCIA_APROBADA = process.env['E2E_PROG_VIGENCIA_APROBADA'] || '2025';
/** PAA aprobado con auditorías hijas y auditorías especiales (Asignar, Especiales). */
export const VIGENCIA_CON_AUDITORIAS = process.env['E2E_PROG_VIGENCIA_AUDITORIAS'] || '2026';
/** Vigencia reservada para los escenarios @escritura (sin PAA activo de otra persona). */
export const VIGENCIA_E2E = process.env['E2E_PROG_VIGENCIA_E2E'] || '2010';

/** IDs de estado del PAA del ambiente de pruebas (los mismos de environment.development). */
export const PLAN_ESTADO = environment.PLAN_ESTADO;
/** IDs de tipo de documento del PAA (Formato Original/Actualizado, actas). */
export const TIPO_DOCUMENTO = environment.TIPO_DOCUMENTO_PARAMETROS;
/** IDs de estado de las auditorías concretas en Programación (por asignar, auditor asignado). */
export const AUDITORIA_ESTADO_PROGRAMACION = environment.AUDITORIA_ESTADO.PROGRAMACION;

/** Acciones del menú de un PAA aprobado (accionesPorRolYEstado, rol auditor experto). */
export const ACCIONES_PLAN_APROBADO = ['Ver Marco General', 'Ver Auditorias', 'Ver Documentos', 'Historial de Observaciones'];

/** Columnas de las tablas, en orden. */
export const COLUMNAS_PLANES = ['No.', 'Creado Por', 'Vigencia', 'Fecha Creación', 'Estado', 'Acciones'];
export const COLUMNAS_AUDITORIAS_PLAN = ['No.', 'Auditoría', 'Tipo de Evaluación', 'Macroprocesos', 'Procesos', 'Dependencias', 'Cronograma', 'Cantidad', 'Estado'];
export const COLUMNAS_ASIGNAR = ['No.', 'Auditoria', 'Tipo de Evaluación', 'Auditor(es)', 'Estado', 'Acciones'];

type SimularGet = (patron: string | RegExp, transformar: (data: any[]) => any[]) => Promise<void>;

/**
 * Muestra el PAA de la vigencia en otro estado sin tocar el backend (@simulado). Reescribe las dos
 * consultas de las que sale lo que se ve: el listado de planes del MID (fila y menú de acciones) y el
 * estado actual del CRUD (`estado?query=plan_auditoria_id:<id>,actual:true`, que decide los botones de
 * edición y de revisión).
 */
export async function simularPlanEnEstado(simularGet: SimularGet, vigencia: string, estadoId: number) {
  const planes = new Set<string>();
  await simularGet(/plan_anual_auditoria_mid\/v1\/plan-auditoria\?/, (data) =>
    data.map((plan) => {
      if (plan.vigencia_nombre !== vigencia || plan.activo === false) return plan;
      planes.add(plan._id);
      return { ...plan, estado: { ...plan.estado, estado_id: estadoId } };
    }),
  );
  await simularGet(/plan_anual_auditoria_crud\/v1\/estado\?/, (data) =>
    data.map((estado) => (planes.has(estado.plan_auditoria_id) ? { ...estado, estado_id: estadoId } : estado)),
  );
}
