export const planMejoramientoConstructorTabla = [
  { columnDef: "numero",      header: "No.",           cell: (plan: any) => "",                    sortable: false  },
  { columnDef: "vigencia",    header: "Vigencia",      cell: (plan: any) => plan.vigencia_nombre,  sortable: false  },
  { columnDef: "auditoria",   header: "Auditoría",     cell: (plan: any) => plan.titulo,           sortable: false  },
  { columnDef: "auditores",   header: "Auditor(es)",   cell: (plan: any) => plan.auditores_nombres,sortable: false  },
  { columnDef: "dependencia", header: "Dependencia",   cell: (plan: any) => plan.dependencia_nombre,sortable: false },
  { columnDef: "lider",       header: "Líder",         cell: (plan: any) => plan.lider_nombre,     sortable: false  },
  { columnDef: "responsable", header: "Responsable",   cell: (plan: any) => plan.responsable_nombre,sortable: false },
  { columnDef: "estado",      header: "Estado",        cell: (plan: any) => plan.estado_nombre,    sortable: false  },
  { columnDef: "acciones",    header: "Acciones",      cell: (plan: any) => "",                    sortable: false },
];