import { tituloYSubtituloAuditoria } from "src/app/shared/data/models/auditoria";

export const seguimientosConstructorTabla = [
  {
    columnDef: "numero",
    header: "No.",
    cell: (seguimiento: any) => "",
    sortable: false,
  },
  {
    columnDef: "vigencia",
    header: "Vigencia",
    cell: (seguimiento: any) => seguimiento.vigencia_nombre || seguimiento.vigencia,
    sortable: false,
  },
  {
    columnDef: "auditoria",
    header: "Auditoría",
    cell: (seguimiento: any) => tituloYSubtituloAuditoria(seguimiento),
    sortable: false,
  },
  {
    columnDef: "auditores",
    header: "Auditor(es)",
    cell: (seguimiento: any) => seguimiento.auditores_nombres || "Auditor asignado",
    sortable: false,
  },
  {
    columnDef: "dependencia",
    header: "Dependencia",
    cell: (seguimiento: any) => seguimiento.dependencia_nombre || "Dependencia",
    sortable: false,
  },
  {
    columnDef: "lider",
    header: "Líder",
    cell: (seguimiento: any) => seguimiento.lider_nombre || "Nombre Líder",
    sortable: false,
  },
  {
    columnDef: "responsable",
    header: "Responsable",
    cell: (seguimiento: any) => seguimiento.responsable_nombre || "Nombre responsable",
    sortable: false,
  },
  {
    columnDef: "estado",
    header: "Estado",
    cell: (seguimiento: any) => seguimiento.estado_nombre || seguimiento.estado_id,
    sortable: false,
  },
  {
    columnDef: "acciones",
    header: "Acciones",
    cell: (seguimiento: any) => "",
    sortable: false,
  },
];
