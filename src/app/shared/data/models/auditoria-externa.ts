/** Auditoría externa tal como la devuelve el listado del MID (#953). */
export interface AuditoriaExterna {
  _id: string;
  vigencia_id: number;
  vigencia_nombre: string;
  codigo_entidad: string;
  nombre_entidad: string;
  nombre_auditoria: string;
  /** Fecha ISO de emisión del informe final. */
  fecha_informe_final: string;
  dependencia_id: number[];
  estado_id: number;
}

export interface HallazgoExternoGuardado {
  _id: string;
  vigencia_id: number;
  vigencia_nombre: string;
  codigo_auditoria: string;
  numeral: string;
  descripcion: string;
  dependencia_id: number[];
  dependencias_nombre: string[];
}

export interface InformeFinalGuardado {
  nuxeo_id: number;
  nuxeo_enlace: string;
}

/** Detalle de una auditoría externa (solo lectura). */
export interface AuditoriaExternaDetalle extends AuditoriaExterna {
  dependencias_nombre: string[];
  hallazgos: HallazgoExternoGuardado[];
  informe_final: InformeFinalGuardado | null;
  plan_mejoramiento: { _id: string; estado_id: number } | null;
}

export interface ListadoAuditoriasExternas {
  auditorias: AuditoriaExterna[];
  total: number;
}

/** Resultado del registro: ids de la auditoría y de su plan de mejoramiento. */
export interface ResultadoRegistroAuditoriaExterna {
  auditoria_externa_id: string;
  plan_mejoramiento_id: string;
}
