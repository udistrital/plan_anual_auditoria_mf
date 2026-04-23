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
    cell: (auditoria: any) => auditoria.auditoria_nombre,
    sortable: false,
  },
  {
    columnDef: "origen",
    header: "Origen",
    cell: (auditoria: any) => auditoria.origen,
    sortable: false,
  },
  {
    columnDef: "auditores",
    header: "Auditor(es)",
    cell: (auditoria: any) => auditoria.auditores.map((auditor: any) => auditor.nombre).join(", "),
    sortable: false,
  },
  {
    columnDef: "dependencia",
    header: "Dependencia",
    cell: (auditoria: any) => auditoria.dependencia_nombre,
    sortable: false,
  },
  {
    columnDef: "acciones",
    header: "Acciones",
    cell: (auditoria: any) => "",
    sortable: false,
  },
];
