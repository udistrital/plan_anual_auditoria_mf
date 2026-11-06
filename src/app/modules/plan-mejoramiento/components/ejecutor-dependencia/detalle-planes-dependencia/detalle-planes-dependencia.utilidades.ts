export const detallePlanesDependenciaConstructorTabla = [
  {
    columnDef: "vigencia",
    header: "Vigencia",
    cell: (plan: any) => plan.vigencia_nombre ?? plan.vigencia_id ?? "—",
    sortable: false,
  },
  {
    columnDef: "apertura",
    header: "Fecha apertura",
    cell: (plan: any) => plan.fecha_apertura,
    sortable: false,
  },
  {
    columnDef: "limite",
    header: "Fecha límite",
    cell: (plan: any) => plan.fecha_limite,
    sortable: false,
  },
  {
    columnDef: "estado",
    header: "Estado",
    cell: (plan: any) => plan.estado_nombre ?? "Estado " + plan.estado_id,
    sortable: false,
  },
  {
    columnDef: "ejecutores",
    header: "Ejecutor asignado",
    cell: (plan: any) =>
      plan.ejecutores?.length
        ? plan.ejecutores.map((e: any) => e.usuario_nombre).join(", ")
        : "Sin asignar",
    sortable: false,
  },
  {
    columnDef: "acciones",
    header: "Acciones",
    cell: (_plan: any) => "",
    sortable: false,
  },
];
