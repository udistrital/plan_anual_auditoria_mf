export class Auditoria {
    _id!: string;
    activo!: boolean;
    titulo!: string;
    tipo_evaluacion_nombre!: string[];
    tipo_evaluacion_id!: number[];
    cronograma_nombre!: string[];
    cronograma_id!: number[];
    vigencia_id!: number;
    vigencia_nombre!: string;
    estado!: string;
    auditores!: number[];
}

export class auditorEliminar{
    id!: string;
    activo!: boolean;
    id_tercero!: number;
    auditoria_id!: string;
}