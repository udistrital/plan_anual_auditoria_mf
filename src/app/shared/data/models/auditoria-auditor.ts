export class Auditoria {
    _id!: string;
    activo!: boolean;
    titulo!: string;
    subtitulo!: string;
    tipo_evaluacion_nombre!: string[];
    tipo_evaluacion_id!: number[];
    cronograma_nombre!: string[];
    cronograma_id!: number[];
    vigencia_id!: number;
    vigencia_nombre!: string;
    estado_nombre!: string;
    estado_id!: number
    auditores!: number[];
}

export class AuditorEliminar {
    id!: string;
    activo!: boolean;
    id_tercero!: number;
    auditoria_id!: string;
}

export interface Auditor {
    _id: string;
    id: number;
    nombre: string;
    documento: number;
    auditor_lider?: boolean;
    auditor_id?: number;
}
