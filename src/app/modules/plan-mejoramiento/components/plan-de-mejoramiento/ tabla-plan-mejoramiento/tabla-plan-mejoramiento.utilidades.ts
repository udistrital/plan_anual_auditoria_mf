export const planMejoramientoConstructorTabla = [
  {
    columnDef: "numero",
    header: "No.",
    cell: (plan: any) => "",
    sortable: false,
  },
  {
    columnDef: "vigencia",
    header: "Vigencia",
    cell: (plan: any) => plan.vigencia_nombre,
    sortable: true,
  },
  {
    columnDef: "auditoria",
    header: "Auditoría",
    cell: (plan: any) => plan.titulo,
    sortable: true,
  },
  {
    columnDef: "tipo",
    header: "Tipo",
    cell: (plan: any) => plan.tipo_evaluacion_nombre,
    sortable: true,
  },
  {
    columnDef: "auditores_auditoria",
    header: "Auditor(es) Responsable(s) Auditoría",
    cell: (plan: any) =>
      plan.auditores
        ?.map((a: any) => a.auditor_nombre)
        ?.join(", ") ?? "Sin auditor(es)",
    sortable: false,
  },
  {
    columnDef: "dependencia",
    header: "Dependencia",
    cell: (plan: any) => plan.dependencia_nombre,
    sortable: true,
  },
  {
    columnDef: "auditores_plan",
    header: "Auditor(es) Responsable(s) Plan",
    cell: (plan: any) =>
      plan.auditores_plan?.length
        ? plan.auditores_plan.map((a: any) => a.nombre).join(", ")
        : "Sin Auditor(es)",
    sortable: false,
  },
  {
    columnDef: "estado",
    header: "Estado",
    cell: (plan: any) => plan.estadoPlanNombre,
    sortable: true,
  },
  {
    columnDef: "acciones",
    header: "Acciones",
    cell: (plan: any) => "",
    sortable: false,
  },
];