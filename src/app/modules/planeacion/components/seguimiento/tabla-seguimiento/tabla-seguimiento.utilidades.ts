import { tituloYSubtituloAuditoria } from "src/app/shared/data/models/auditoria";

export const colocacionesContructorTabla = [
  {
    columnDef: "numero",
    header: "No.",
    cell: (auditoria: any) => "",
    sortable: false,
  },
  {
    columnDef: "vigencia",
    header: "Vigencia",
    cell: (auditoria: any) => auditoria.vigencia_nombre,
    sortable: false,
  },
  {
    columnDef: "auditoria",
    header: "Auditoria",
    cell: (auditoria: any) => tituloYSubtituloAuditoria(auditoria),
    sortable: false,
  },
  {
    columnDef: "tipo_evaluacion",
    header: "Tipo Evaluación",
    cell: (auditoria: any) => auditoria.tipo_evaluacion_nombre,
    sortable: false,
  },
  {
    columnDef: "auditores",
    header: "Auditor(es)",
    cell: (auditoria: any) =>
      auditoria.auditores
        ?.map((auditor: any) => auditor.auditor_nombre)
        .join(", "),
    sortable: false,
  },
  {
    columnDef: "dependencia",
    header: "Dependencia",
    cell: (auditoria: any) => auditoria.dependencia_nombre,
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