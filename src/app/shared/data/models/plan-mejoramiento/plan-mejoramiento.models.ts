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
