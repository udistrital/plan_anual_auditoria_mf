export interface Auditoria {
  _id: string;
  plan_auditoria_id: string;
  titulo: string;
  subtitulo: string;
  tipo_evaluacion_id: number;
  cronograma_id: number[];
  estado_id: number;
  consecutivo_no_auditoria: number;
  vigencia_id: number;
  consecutivo_OCI: string;
  consecutivo_IE: string;
  macroproceso_id: number;
  proceso_id: number;
  dependencia_id: number;
  jefe_nombre: number;
  asistente_nombre: number;
  fecha_inicio: string;
  fecha_fin: string;
  objetivo: string;
  alcance: string;
  criterio: string;
  rec_tecnologico: string;
  rec_humano: string;
  rec_fisico: string;
  tema: string
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
  tipo_evaluacion_nombre: string;
  cronograma_nombre: string[];
  estado_nombre: string;
  tipo_nombre: string;
  vigencia_nombre: string;
  macroproceso_nombre: string;
  proceso_nombre: string;
  dependencia_nombre: string;
  estado_interno_id?: number;
  jefe_correo?: string;
  asistente_correo?: string;
  correo_dependencia?: string;
  correo_complementario?: string;
}

export function tituloYSubtituloAuditoria(auditoria: Auditoria): string {
  return auditoria.subtitulo ? `${auditoria.titulo} - ${auditoria.subtitulo}` : auditoria.titulo;
};
