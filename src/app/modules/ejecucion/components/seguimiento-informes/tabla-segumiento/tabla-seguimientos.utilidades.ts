export const seguimientosConstructorTabla = [
  {
    columnDef: "numero",
    header: "No.",
    cell: (seguimiento: any) => "",
    sortable: true,
  },
  {
    columnDef: "vigencia",
    header: "Vigencia",
    cell: (seguimiento: any) => seguimiento.vigencia_nombre || seguimiento.vigencia,
    sortable: true,
  },
  {
    columnDef: "auditoria",
    header: "Auditoría",
    cell: (seguimiento: any) => seguimiento.titulo || seguimiento.auditoria_nombre,
    sortable: true,
  },
  {
    columnDef: "auditores",
    header: "Auditor(es)",
    cell: (seguimiento: any) => seguimiento.auditores_nombres || "Auditor asignado",
    sortable: true,
  },
  {
    columnDef: "dependencia",
    header: "Dependencia",
    cell: (seguimiento: any) => seguimiento.dependencia_nombre || "Dependencia",
    sortable: true,
  },
  {
    columnDef: "lider",
    header: "Líder",
    cell: (seguimiento: any) => seguimiento.lider_nombre || "Nombre Líder",
    sortable: true,
  },
  {
    columnDef: "responsable",
    header: "Responsable",
    cell: (seguimiento: any) => seguimiento.responsable_nombre || "Nombre responsable",
    sortable: true,
  },
  {
    columnDef: "estado",
    header: "Estado",
    cell: (seguimiento: any) => seguimiento.estado_nombre || seguimiento.estado_id,
    sortable: true,
  },
  {
    columnDef: "acciones",
    header: "Acciones",
    cell: (seguimiento: any) => "",
    sortable: false,
  },
];