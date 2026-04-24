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
    columnDef: "dependencia",
    header: "Dependencia",
    cell: (auditoria: any) => "Pepito Perez",
    sortable: false,
  },
  {
    columnDef: "auditores",
    header: "Auditor(es)",
    cell: (auditoria: any) => "Proceso o Dependencia",
    sortable: false,
  },
  {
    columnDef: "lider",
    header: "Líder",
    cell: (auditoria: any) => "Nombre Líder",
    sortable: false,
  },
  {
    columnDef: "responsable",
    header: "Responsable",
    cell: (auditoria: any) => "Nombre responsable",
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
