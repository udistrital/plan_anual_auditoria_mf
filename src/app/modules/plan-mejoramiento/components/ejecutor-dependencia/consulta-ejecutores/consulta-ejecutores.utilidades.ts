export const consultaEjecutoresConstructorTabla = [
  {
    columnDef: "dependencia",
    header: "Dependencia",
    cell: (fila: any) => fila.dependencia_nombre,
    sortable: false,
  },
  {
    columnDef: "ejecutor",
    header: "Ejecutor asignado",
    cell: (fila: any) =>
      fila.ejecutores?.length
        ? fila.ejecutores.map((e: any) => e.usuario_nombre).join(", ")
        : "Sin asignar",
    sortable: false,
  },
  {
    columnDef: "fechaAsignacion",
    header: "Fecha asignación",
    cell: (fila: any) =>
      fila.ejecutores?.length ? fila.ejecutores[0].fecha_asignacion : "",
    sortable: false,
  },
  {
    columnDef: "estado",
    header: "Estado",
    cell: (fila: any) =>
      fila.ejecutores?.length > 0 ? "Asignado" : "Sin asignar",
    sortable: false,
  },
  {
    columnDef: "acciones",
    header: "Acciones",
    cell: (_fila: any) => "",
    sortable: false,
  },
];
