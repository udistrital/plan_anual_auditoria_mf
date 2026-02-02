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
    cell: (auditoria: any) => auditoria.titulo,
    sortable: true,
  },
  {
    columnDef: "auditores",
    header: "Auditor(es)",
    cell: (auditoria: any) =>
      auditoria.auditores
        ?.map((auditor: any) => auditor.auditor_nombre)
        .join(", "),
    sortable: true,
  },
  {
    columnDef: "dependencia",
    header: "Dependencia",
    cell: (auditoria: any) => auditoria.dependencia,
    sortable: true,
  },
  {
    columnDef: "lider",
    header: "Líder",
    cell: (auditoria: any) => auditoria.lider_nombre,
    sortable: true,
  },
  {
    columnDef: "responsable",
    header: "Responsable",
    cell: (auditoria: any) => auditoria.responsable_nombre,
    sortable: true,
  },
  {
    columnDef: "estado",
    header: "Estado",
    cell: (auditoria: any) => auditoria.estado_nombre,
    sortable: true,
  },
  {
    columnDef: "documentos",
    header: "Documentos",
    cell: (auditoria: any) => "",
    sortable: true,
  },
  {
    columnDef: "acciones",
    header: "Acciones",
    cell: (auditoria: any) => "",
    sortable: false,
  },
];
