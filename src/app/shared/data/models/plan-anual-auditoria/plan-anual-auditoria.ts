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
    macroproceso!: string;
    macroprocesoId!: number
    proceso!: string;
    procesoId!: number;
    dependencia!: string;
    dependenciaId!: number;
    cronograma!: string;
    cronogramaId!: number[];
    vigencia_id!: number;
    estado_nombre!: string;
    estado!: string;
    estado_id!: number;
    auditores!: number[];
}
export class Actividad{
    id!:string;
    auditoriaId!:string;
    titulo!:string;
    fechaInicio!:Date;
    fechaFin!:Date;
}
