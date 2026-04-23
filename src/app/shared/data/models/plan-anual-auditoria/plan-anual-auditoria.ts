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
    macroprocesos!: string;
    macroprocesosId!: number[];
    procesos!: string;
    procesosId!: number[];
    dependencias!: string;
    dependenciasId!: number[];
    cronograma!: string;
    cronogramaId!: number[];
    cantidadAuditorias!: number;
    vigencia_id!: number;
    estado_nombre!: string;
    estado!: string;
    estado_id!: number;
    auditores!: number[];
}
export class Actividad{
    id!: string | undefined;
    actividad!: string;
    auditoriaId?: string;
    fechaInicio!: Date;
    fechaFin!: Date;
    observaciones?: string;
    papelTrabajoReferencia?: string;
    papelTrabajoDescripcion?: string;
    papelTrabajoFolios?: number;
    papelTrabajoMedio?: string;
    papelTrabajoCarpeta?: string;
}
