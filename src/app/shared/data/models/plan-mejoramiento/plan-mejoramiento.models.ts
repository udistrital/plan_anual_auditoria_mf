export interface PlanMejoramiento {
  _id: string;
  auditoria_id: string;
  vigencia_id: number;
  tipo_evaluacion_id: number;
  fecha_apertura: string;
  fecha_limite: string;
  estado_id: number;
  fuente: number;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
}

export interface PlanMejoramientoAuditor {
  _id: string;
  plan_mejoramiento_id: string;
  auditor_id: number;
  asignado: boolean;
  asignado_por_id: number;
  auditor_lider: boolean;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
}

export interface PlanMejoramientoEstado {
  _id: string;
  plan_mejoramiento_id: string;
  usuario_id: number;
  usuario_rol: string;
  observacion: string;
  actual: boolean;
  estado_id: number;
  fase_id: string;
  fecha_ejecucion_estado: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
}

export interface AccionMejora {
  _id: string;
  plan_mejoramiento_id: string;
  hallazgo_id: string;
  descripcion: string;
  tipo: string;
  nombre_indicador: string;
  formula_indicador: string;
  meta: string;
  comentario_auditor: string;
  estado_id: number;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
}

export interface AccionMejoraResponsable {
  _id: string;
  accion_mejora_id: string;
  dependencia_id: number;
  lider_id: number;
  tipo_responsable: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
}

export interface SeguimientoAccion {
  _id: string;
  accion_mejora_id: string;
  plan_mejoramiento_id: string;
  usuario_id: number;
  usuario_rol: string;
  descripcion_avance: string;
  porcentaje_avance: number;
  fecha_avance: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
}

export interface EficaciaAccion {
  _id: string;
  accion_mejora_id: string;
  auditor_id: number;
  calificacion: number;
  observacion: string;
  fecha_calificacion: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
}

// Respuesta de plan-mejoramiento/formulacion/auditado/{persona_id}/{cargo_id}/resumen (MID)
export interface ResumenFormulacionPlanes {
  auditorias_finalizadas: number;
  sin_formular: number;
  en_formulacion: number;
  en_revision: number;
  aprobados: number;
}

// Elemento de plan-mejoramiento/formulacion/auditado/{persona_id}/{cargo_id} (MID)
export interface AuditoriaFormulacionPlan {
  auditoria_id: string;
  no_auditoria: string;
  vigencia_nombre: string;
  titulo: string;
  tipo_evaluacion_nombre: string;
  auditores_auditoria: string[];
  auditores_plan: string[];
  dependencia_nombre: string;
  plan_mejoramiento_id: string | null;
  estado_plan_id: number;
  estado_plan_nombre: string;
  total_hallazgos: number;
  total_observaciones: number;
}

// Respuesta de plan-mejoramiento/formulacion/auditor/{persona_id}/resumen (MID)
export interface ResumenFormulacionAuditor {
  total_auditorias: number;
  sin_formular: number;
  en_formulacion: number;
  en_revision: number;
  con_observaciones: number;
  aprobados: number;
}

// Elemento de plan-mejoramiento/formulacion/auditor/{persona_id} (MID)
export interface AuditoriaFormulacionAuditor extends AuditoriaFormulacionPlan {
  fecha_inicio: string | null;
  fecha_fin: string | null;
  /** Aprobación del informe final: desde ahí corre la formulación del plan. */
  fecha_aprobacion_informe: string | null;
  /** Plazo de formulación del plan (apertura + 8 días hábiles). */
  fecha_limite: string | null;
  /** Fecha del estado actual del plan (radicación, devolución o aprobación). */
  fecha_estado: string | null;
  total_acciones: number;
  acciones_aprobadas: number;
  asignada: boolean;
}

/** Grupo excluyente de una acción en Gestión de Acciones (lo calcula el MID). */
export type GrupoAccion = "PENDIENTE_HABILITAR" | "CARGUE_ABIERTO" | "EN_REVISION" | "CALIFICADAS";

// Respuesta de gestion-accion/{auditado/{persona_id}/{cargo_id} | auditor/{persona_id}}/resumen (MID)
export interface ResumenGestionAcciones {
  total: number;
  pendiente_habilitar: number;
  cargue_abierto: number;
  en_revision: number;
  calificadas: number;
  eficaces: number;
  en_riesgo: number;
}

// Elemento de gestion-accion/{auditado/{persona_id}/{cargo_id} | auditor/{persona_id}} (MID)
export interface AccionGestion {
  accion_id: string;
  plan_mejoramiento_id: string;
  auditoria_id: string;
  no_auditoria: string;
  nombre_auditoria: string;
  tipo_evaluacion_nombre: string;
  no_hallazgo: string;
  descripcion_hallazgo: string;
  no_accion: string;
  /** "Preventiva" | "Correctiva" | "" */
  tipo_accion_nombre: string;
  descripcion_accion: string;
  /** "" si no hay responsable líder. */
  dependencia_lider: string;
  dependencias_apoyo: string[];
  auditores_plan: string[];
  fecha_inicio: string | null;
  fecha_fin: string | null;
  /** true = cargue de soportes habilitado para el auditado. */
  en_revision: boolean;
  total_soportes: number;
  calificacion: number | null;
  fecha_calificacion: string | null;
  grupo: GrupoAccion;
  eficaz: boolean;
  en_riesgo: boolean;
  /** Días hasta fecha_fin (negativo si venció); null sin fecha_fin. */
  dias_para_vencer: number | null;
  /** La persona consultada es auditor del plan (solo vista auditor; false en auditado). */
  auditor_plan_asignado: boolean;
}
