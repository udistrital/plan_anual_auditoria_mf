export const colocacionesContructorTabla = [
  {
    columnDef: "numero",
    header: "No.",
    cell: (auditoria: any) => "",
    sortable: true,
  },
  {
    columnDef: "vigencia",
    header: "Vigencia",
    cell: (auditoria: any) => auditoria.vigencia_nombre,
    sortable: true,
  },
  {
    columnDef: "auditoria",
    header: "Auditoria",
    cell: (auditoria: any) => auditoria.auditoria_nombre,
    sortable: true,
  },
  {
    columnDef: "origen",
    header: "Origen",
    cell: (auditoria: any) => auditoria.origen,
    sortable: true,
  },
  {
    columnDef: "auditores",
    header: "Auditor(es)",
    cell: (auditoria: any) => auditoria.auditores.map((auditor: any) => auditor.nombre).join(", "),
    sortable: true,
  },
  {
    columnDef: "dependencia",
    header: "Dependencia",
    cell: (auditoria: any) => auditoria.dependencia_nombre,
    sortable: true,
  },
  {
    columnDef: "acciones",
    header: "Acciones",
    cell: (auditoria: any) => "",
    sortable: false,
  },
];
