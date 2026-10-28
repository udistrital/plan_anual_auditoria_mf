/** Opciones del menú por fase y la pantalla que deben abrir (ver specs/navegacion-por-fases.plan.md). */
export interface OpcionFase {
  menu: string[];
  url: string;
  titulo: string;
}

const PLANEACION_Y_EJECUCION: OpcionFase[] = [
  {
    menu: ['Gestión de Auditoría', 'Planeación', 'Auditorías Internas'],
    url: '/gestion-auditoria/planeacion/auditorias-internas',
    titulo: 'Auditorías internas',
  },
  {
    menu: ['Gestión de Auditoría', 'Planeación', 'Seguimiento e Informes de Ley'],
    url: '/gestion-auditoria/planeacion/seguimiento',
    titulo: 'Planeación de Seguimientos e Informes de Ley',
  },
  {
    menu: ['Gestión de Auditoría', 'Ejecución', 'Auditorías Internas'],
    url: '/gestion-auditoria/ejecucion/auditorias-internas',
    titulo: 'Auditorías internas',
  },
  {
    menu: ['Gestión de Auditoría', 'Ejecución', 'Seguimiento e Informes de Ley'],
    url: '/gestion-auditoria/ejecucion/seguimiento-informes',
    titulo: 'Seguimiento e Informes',
  },
];

export const ASIGNAR_PLANES: OpcionFase = {
  menu: ['Planes de Mejoramiento', 'Asignar Planes'],
  url: '/gestion-auditoria/plan-mejoramiento/asignar-auditores',
  titulo: 'Asignar planes',
};

export const FORMULACION_PLANES: OpcionFase = {
  menu: ['Planes de Mejoramiento', 'Formulación de planes'],
  url: '/gestion-auditoria/plan-mejoramiento',
  titulo: 'Formulación de planes',
};

export const GESTION_ACCIONES: OpcionFase = {
  menu: ['Planes de Mejoramiento', 'Gestión de Acciones'],
  url: '/gestion-auditoria/plan-mejoramiento/gestion-acciones',
  titulo: 'Gestión de Acciones',
};

export const FASES_AUDITOR = [...PLANEACION_Y_EJECUCION, ASIGNAR_PLANES, FORMULACION_PLANES, GESTION_ACCIONES];
export const FASES_JEFE_DEPENDENCIA = [...PLANEACION_Y_EJECUCION, ASIGNAR_PLANES, GESTION_ACCIONES];
export const MENU_PRINCIPAL = ['Gestión de Auditoría', 'Planes de Mejoramiento'];
