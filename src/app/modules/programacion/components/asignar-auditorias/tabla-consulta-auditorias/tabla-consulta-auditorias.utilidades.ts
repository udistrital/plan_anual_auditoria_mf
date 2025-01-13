export const colocacionesContructorTabla = [
  {
    columnDef: "numero",
    header: "No.",
    cell: (auditoria: any) => "",
    sortable: true,
  },
  // {
  //   columnDef: "vigencia",
  //   header: "Vigencia",
  //   cell: (auditoria: any) => auditoria.vigencia_nombre,
  //   sortable: true,
  // },
  {
    columnDef: "auditoria",
    header: "Auditoria",
    cell: (auditoria: any) => auditoria.titulo,
    sortable: true,
  },
  {
    columnDef: "tipoEvaluacion",
    header: "Tipo de Evaluación",
    cell: (auditoria: any) => auditoria.tipo_evaluacion_id,
    sortable: true,
  },
  {
    columnDef: "auditores",
    header: "Auditor(es)",
    cell: (auditoria: any) => "Pepito Perez",
    sortable: true,
  },
  // {
  //   columnDef: "lider",
  //   header: "Líder",
  //   cell: (auditoria: any) => "Nombre Líder",
  //   sortable: true,
  // },
  {
    columnDef: "cronograma",
    header: "Cronograma de Actividades",
    cell: (auditoria: any) => auditoria.cronograma_id,
    sortable: true,
  },
  {
    columnDef: "estado",
    header: "Estado",
    cell: (auditoria: any) => auditoria.estado_id,
    sortable: true,
  },
  // {
  //   columnDef: "documentos",
  //   header: "Documento",
  //   cell: (auditoria: any) => "",
  //   sortable: false,
  // },
  {
    columnDef: "acciones",
    header: "Acciones",
    cell: (auditoria: any) => "",
    sortable: false,
  },
];
