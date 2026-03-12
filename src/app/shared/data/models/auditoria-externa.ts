export interface AuditoriaExterna {
  _id: string;
  vigencia_nombre: string;
  auditoria_nombre: string;
  origen: string;
  auditores: object[] | string[];
  dependencia_nombre: string;
}