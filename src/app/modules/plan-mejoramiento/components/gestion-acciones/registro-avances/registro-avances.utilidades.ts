export interface CriterioEvaluacion {
  id: number;
  nombre: string;
  min: number;
  max: number;
  claseChip: string;
}

/** Criterios de evaluación de la calificación y el rango de porcentaje que sugiere cada uno. */
export const CRITERIOS_EVALUACION: CriterioEvaluacion[] = [
  { id: 1, nombre: 'Crítico', min: 0, max: 20, claseChip: 'chip-error' },
  { id: 2, nombre: 'En progreso', min: 21, max: 79, claseChip: 'chip-alerta' },
  { id: 3, nombre: 'Satisfactorio', min: 80, max: 100, claseChip: 'chip-ok' },
];

/** Mismos nombres que usa la tabla de hallazgos del plan. */
export const TIPOS_ACCION: Record<number, string> = { 1: 'Preventiva', 2: 'Correctiva' };

export const MAX_CARACTERES_ANALISIS = 2000;

export const AYUDAS_CALIFICACION = {
  avance: 'Calcúlelo con el indicador y la evidencia entregada. Si el indicador no es coherente con la acción, use el resultado del análisis de la evidencia.',
  criterio: 'Se sugiere según el porcentaje; puede cambiarlo si el examen documental lo justifica.',
  analisis: 'Describa el estado real de la acción: en qué momento de desarrollo está, qué soportes se presentaron y cómo se evaluaron.',
};

export function criterioPorId(id: number | null | undefined): CriterioEvaluacion | undefined {
  return CRITERIOS_EVALUACION.find(c => c.id === Number(id));
}

export function criterioSugerido(porcentaje: number | null | undefined): CriterioEvaluacion | undefined {
  if (porcentaje === null || porcentaje === undefined || Number.isNaN(porcentaje)) return undefined;
  return CRITERIOS_EVALUACION.find(c => porcentaje >= c.min && porcentaje <= c.max);
}

/** Convierte la clave del rol (p. ej. "JEFE_DEPENDENCIA") en un texto legible. */
export function nombreRol(rol: string | null | undefined): string {
  if (!rol) return '';
  const texto = rol.replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
