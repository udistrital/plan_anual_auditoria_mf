import { tituloYSubtituloAuditoria } from "src/app/shared/data/models/auditoria";

export const colocacionesContructorTabla = [
  {
    columnDef: "numero",
    header: "No.",
    cell: (auditoria: any) => "",
    sortable: false,
  },
  {
    columnDef: "auditoria",
    header: "Auditoria",
    cell: (auditoria: any) => tituloYSubtituloAuditoria(auditoria),
    sortable: false,
  },
  {
    columnDef: "tipoEvaluacion",
    header: "Tipo de Evaluación",
    cell: (auditoria: any) => auditoria.tipo_evaluacion_nombre,
    sortable: false,
  },
  {
    columnDef: "auditores",
    header: "Auditor(es)",
    cell: (auditoria: any) =>
      auditoria.auditores?.map((a: any) => a.auditor_nombre).join(", ") ||
      "Sin Auditor(es)",
    sortable: false,
  },
  {
    columnDef: "estado",
    header: "Estado",
    cell: (auditoria: any) => auditoria.estado_nombre,
    sortable: false,
  },
  {
    columnDef: "acciones",
    header: "Acciones",
    cell: (auditoria: any) => "",
    sortable: false,
  },
];
