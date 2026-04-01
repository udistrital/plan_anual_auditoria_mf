import { Auditoria } from "src/app/shared/data/models/auditoria";

export interface AuditoriaEspecialTablaRow extends Partial<Auditoria> {
  numero?: number;
  cronograma_concat?: string;
  auditores_id?: number[];
  auditores_nombre?: string[];
  esAuditoriaConcreta?: boolean;
  filaOculta?: boolean;
}

export interface ColumnaTablaAuditoriaEspecial {
  columnDef: string;
  header: string;
  cell: (auditoria: AuditoriaEspecialTablaRow) => string;
  sortable: boolean;
}

export const tituloAuditoriaEspecial = (
  auditoria: AuditoriaEspecialTablaRow,
): string => {
  if (auditoria.esAuditoriaConcreta) {
    return auditoria.subtitulo || "Sin Subtitulo";
  }

  return auditoria.titulo || "Sin Titulo";
};

export const cronogramaAuditoriaEspecial = (
  auditoria: AuditoriaEspecialTablaRow,
): string => {
  if (Array.isArray(auditoria.cronograma_nombre) && auditoria.cronograma_nombre.length > 0) {
    return auditoria.cronograma_nombre.join(", ");
  }

  return auditoria.cronograma_concat || "Sin Cronograma";
};

export const colocacionesContructorTablaEspeciales: ColumnaTablaAuditoriaEspecial[] = [
  {
    columnDef: "numero",
    header: "No.",
    cell: (_auditoria: AuditoriaEspecialTablaRow) => "",
    sortable: true,
  },
  {
    columnDef: "auditoria",
    header: "Auditoria",
    cell: (auditoria: AuditoriaEspecialTablaRow) =>
      tituloAuditoriaEspecial(auditoria),
    sortable: true,
  },
  {
    columnDef: "tipoEvaluacion",
    header: "Tipo de evaluacion",
    cell: (auditoria: AuditoriaEspecialTablaRow) =>
      auditoria.tipo_evaluacion_nombre || "Sin Asignar",
    sortable: true,
  },
  {
    columnDef: "auditor",
    header: "Auditor(es)",
    cell: (_auditoria: AuditoriaEspecialTablaRow) =>
      !_auditoria.esAuditoriaConcreta ? ""
        : (_auditoria.auditores_nombre ? _auditoria.auditores_nombre.join(", ") : "Sin Auditores"),
    sortable: true,
  },
  {
    columnDef: "cronograma",
    header: "Cronograma de Actividades",
    cell: (auditoria: AuditoriaEspecialTablaRow) =>
      cronogramaAuditoriaEspecial(auditoria),
    sortable: true,
  },
  {
    columnDef: "estado",
    header: "Estado",
    cell: (auditoria: AuditoriaEspecialTablaRow) =>
      auditoria.estado_nombre || "Sin estado",
    sortable: true,
  },
  {
    columnDef: "acciones",
    header: "Acciones",
    cell: (_auditoria: AuditoriaEspecialTablaRow) => "",
    sortable: false,
  },
];
