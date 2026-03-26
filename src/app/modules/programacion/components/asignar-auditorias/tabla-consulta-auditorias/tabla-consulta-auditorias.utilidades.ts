import { tituloYSubtituloAuditoria } from "src/app/shared/data/models/auditoria";

export const colocacionesContructorTabla = [
  {
    columnDef: "numero",
    header: "No.",
    cell: (auditoria: any) => "",
    sortable: true,
  },
  {
    columnDef: "auditoria",
    header: "Auditoria",
    cell: (auditoria: any) => tituloYSubtituloAuditoria(auditoria),
    sortable: true,
  },
  {
    columnDef: "tipoEvaluacion",
    header: "Tipo de Evaluación",
    cell: (auditoria: any) => auditoria.tipo_evaluacion_nombre,
    sortable: true,
  },
  {
    columnDef: "auditores",
    header: "Auditor(es)",
    cell: (auditoria: any) =>
      auditoria.auditores?.map((a: any) => a.auditor_nombre).join(", ") ||
      "Sin Auditor(es)",
    sortable: true,
  },
  {
    columnDef: "cronograma",
    header: "Cronograma de Actividades",
    cell: (auditoria: any) => auditoria.cronograma,
    sortable: true,
  },
  {
    columnDef: "estado",
    header: "Estado",
    cell: (auditoria: any) => auditoria.estado_nombre,
    sortable: true,
  },
  {
    columnDef: "acciones",
    header: "Acciones",
    cell: (auditoria: any) => "",
    sortable: false,
  },
];
