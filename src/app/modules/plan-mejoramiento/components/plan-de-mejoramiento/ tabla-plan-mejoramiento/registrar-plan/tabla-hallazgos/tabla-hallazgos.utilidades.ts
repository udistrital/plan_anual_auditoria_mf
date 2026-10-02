export const hallazgosConstructorTabla = [
  {
    columnDef: 'noHallazgo',
    header: 'No Hallazgo',
    sortable: false,
    cell: (fila: any) => fila.hallazgoIndice,
  },
  {
    columnDef: 'descripcion',
    header: 'Descripción del Hallazgo',
    sortable: false,
    cell: (fila: any) => fila.hallazgoDescripcion,
  },
  {
    columnDef: 'causa',
    header: 'Causa del Hallazgo',
    sortable: false,
    cell: (fila: any) => fila.hallazgoCausa || 'Sin causa registrada',
  },
  {
    columnDef: 'numero',
    header: 'No. Acción',
    sortable: false,
    cell: (fila: any) => fila.accion?.numero,
  },
  {
    columnDef: 'tipoAccion',
    header: 'Tipo de Acción',
    sortable: false,
    cell: (fila: any) => fila.accion?.tipoAccion,
  },
  {
    columnDef: 'accionPlanteada',
    header: 'Acción Planteada',
    sortable: false,
    cell: (fila: any) => fila.accion?.accionPlanteada,
  },
  {
    columnDef: 'nombreIndicador',
    header: 'Nombre de Indicador',
    sortable: false,
    cell: (fila: any) => fila.accion?.nombreIndicador,
  },
  {
    columnDef: 'formulaIndicador',
    header: 'Formula de Indicador',
    sortable: false,
    cell: (fila: any) => fila.accion?.formulaIndicador,
  },
  {
    columnDef: 'meta',
    header: 'Meta',
    sortable: false,
    cell: (fila: any) => fila.accion?.meta,
  },
  {
    columnDef: 'responsable',
    header: 'Responsable de la Acción',
    sortable: false,
    cell: (fila: any) => fila.accion?.responsable,
  },
  {
    columnDef: 'fechaInicio',
    header: 'Fecha Inicio',
    sortable: false,
    cell: (fila: any) => fila.accion?.fechaInicio,
  },
  {
    columnDef: 'fechaFin',
    header: 'Fecha Fin',
    sortable: false,
    cell: (fila: any) => fila.accion?.fechaFin,
  },
  {
    columnDef: 'acciones',
    header: 'Acciones',
    sortable: false,
    cell: () => '',
  },
];

export const iconosAccionHallazgo = new Map<string, string>([
  ['Editar Acción', 'edit'],
  ['Eliminar Acción', 'delete'],
]);

export const iconosUtilidadHallazgo = new Map<string, string>([
  ['Agregar Acción', 'add'],
  ['Remitir Hallazgo', 'send'],
  ['Histórico de Remisiones', 'history'],
]);
