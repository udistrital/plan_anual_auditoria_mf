/**
 * Datos semilla de los escenarios de Ejecución y Planeación (ver specs/estabilizacion-ejecucion.plan.md).
 * Los crea `tests/semillas/ejecucion-2010.spec.ts` en la vigencia de E2E y no se limpian.
 */
import { VIGENCIA_E2E } from '../programacion/datos';

export const VIGENCIA_SEMILLA = VIGENCIA_E2E;

/** Auditoría con el preinforme en revisión del Jefe: el auditor la abre con "Ver Preinforme". */
export const SEMILLA_RESUMEN_HALLAZGOS = {
  titulo: 'SEMILLA-E2E Resumen de hallazgos',
  consecutivo: process.env['E2E_AUDITORIA_CON_HALLAZGOS'] || 'SEMILLA-E2E-01',
  tema: 'TEMA SEMILLA E2E',
  subtema: 'SUBTEMA SEMILLA E2E',
  hallazgos: [
    {
      criterio: 'Resolución No. 129 de 2022 de la Rectoría',
      titulo: 'Rezago en el plaqueteo y legalización de bienes',
      descripcion:
        'Justificación: quedó en evidencia que varios equipos de cómputo permanecen almacenados y sin operar ' +
        'debido a la falta de asignación de sus placas de inventario. Texto largo de la semilla E2E.',
    },
    {
      criterio: 'Resolución DDC-000001 de 2019',
      titulo: 'Bienes sin placa en los laboratorios',
      descripcion:
        'Justificación: durante las visitas de inspección física se constató la existencia de instrumentos ' +
        'desprovistos de la placa de inventario institucional. Texto largo de la semilla E2E.',
    },
  ],
};

/** Auditoría con el programa de trabajo aprobado por el auditado: lista para "Iniciar Ejecución". */
export const SEMILLA_INICIAR_EJECUCION = {
  titulo: 'SEMILLA-E2E Iniciar ejecución',
  consecutivo: process.env['E2E_AUDITORIA_PROGRAMA_APROBADO'] || 'SEMILLA-E2E-02',
};
