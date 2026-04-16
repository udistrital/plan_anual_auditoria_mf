export interface Actividad {
  _id?: string;
  auditoria_id: string;
  titulo: string;
  fecha_inicio: string;
  fecha_fin: string;
  referencia?: string;
  descripcion?: string;
  observacion?: string;
  folio?: number;
  medio?: string;
  carpeta?: string;
}
