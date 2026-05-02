export interface Observacion {
  _id?: string;
  hallazgo_id: string;
  observacion: string;
  dependencia_id: number[];
  usuario_id: number;
  usuario_rol: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
