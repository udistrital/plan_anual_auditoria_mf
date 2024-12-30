export class Plan {
    id!: number;
    creadoPor!: string;
    vigenciaId!: number;
    fechaCreacion!: string;
    estado!: string;
}

export class Auditoria {
    id!: string;
    auditoria!: string;
    tipoEvaluacion!: string;
    tipoEvaluacionId!: number;
    cronograma!: string;
    cronogramaId!: number[];
    vigencia_id!: number;
    estado!: string;
    auditores!: number[];
}
