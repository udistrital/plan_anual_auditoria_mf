export const planMejoramientoConstructorTabla = [
  { columnDef: "numero",      header: "No.",           cell: (plan: any) => "",                    sortable: true  },
  { columnDef: "vigencia",    header: "Vigencia",      cell: (plan: any) => plan.vigencia_nombre,  sortable: true  },
  { columnDef: "auditoria",   header: "Auditoría",     cell: (plan: any) => plan.titulo,           sortable: true  },
  { columnDef: "auditores",   header: "Auditor(es)",   cell: (plan: any) => plan.auditores_nombres,sortable: true  },
  { columnDef: "dependencia", header: "Dependencia",   cell: (plan: any) => plan.dependencia_nombre,sortable: true },
  { columnDef: "lider",       header: "Líder",         cell: (plan: any) => plan.lider_nombre,     sortable: true  },
  { columnDef: "responsable", header: "Responsable",   cell: (plan: any) => plan.responsable_nombre,sortable: true },
  { columnDef: "estado",      header: "Estado",        cell: (plan: any) => plan.estado_nombre,    sortable: true  },
  { columnDef: "acciones",    header: "Acciones",      cell: (plan: any) => "",                    sortable: false },
];