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
    columnDef: "tipo",
    header: "Tipo",
    cell: (auditoria: any) => auditoria.tipo_evaluacion_nombre,
    sortable: true,
  },
  {
    columnDef: "auditores",
    header: "Auditor(es)",
    cell: (auditoria: any) =>
      auditoria.auditores
        ?.map((auditor: any) => auditor.auditor_nombre)
        ?.join(", ") ?? "",
    sortable: true,
  },
  {
    columnDef: "dependencia",
    header: "Dependencia",
    cell: (auditoria: any) => auditoria.dependencia_nombre,
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
