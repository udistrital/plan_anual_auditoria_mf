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

// Asignar Planes redirige a Formulación de Planes: el título depende de la vista del rol
export const ASIGNAR_PLANES: OpcionFase = {
  menu: ['Planes de Mejoramiento', 'Asignar Planes'],
  url: '/gestion-auditoria/plan-mejoramiento/formulacion-planes',
  titulo: 'Bandeja de Revisión y Dictamen de Planes',
};

export const ASIGNAR_PLANES_AUDITADO: OpcionFase = {
  ...ASIGNAR_PLANES,
  titulo: 'Registro de Planes de Mejoramiento',
};

/**
 * Formulación de planes: la misma opción y ruta para los dos roles, con una vista por rol (#916):
 * el auditor OCI revisa y dictamina, el auditado registra su plan. Menú verificado en pruebas el 2026-11-05.
 */
export const FORMULACION_PLANES_AUDITOR: OpcionFase = {
  menu: ['Planes de Mejoramiento', 'Formulación de planes'],
  url: '/gestion-auditoria/plan-mejoramiento/formulacion-planes',
  titulo: 'Bandeja de Revisión y Dictamen de Planes',
};

export const FORMULACION_PLANES_AUDITADO: OpcionFase = {
  menu: ['Planes de Mejoramiento', 'Formulación de planes'],
  url: '/gestion-auditoria/plan-mejoramiento/formulacion-planes',
  titulo: 'Registro de Planes de Mejoramiento',
};

/** Gestión de Acciones: también con una vista por rol desde #916 (textosAuditorGestion / textosAuditadoGestion). */
export const GESTION_ACCIONES_AUDITOR: OpcionFase = {
  menu: ['Planes de Mejoramiento', 'Gestión de Acciones'],
  url: '/gestion-auditoria/plan-mejoramiento/gestion-acciones',
  titulo: 'Seguimiento y Evaluación de Acciones de Mejoramiento',
};

export const GESTION_ACCIONES_AUDITADO: OpcionFase = {
  menu: ['Planes de Mejoramiento', 'Gestión de Acciones'],
  url: '/gestion-auditoria/plan-mejoramiento/gestion-acciones',
  titulo: 'Gestión y Consulta de Acciones de Mejoramiento',
};

export const FASES_AUDITOR = [...PLANEACION_Y_EJECUCION, ASIGNAR_PLANES, FORMULACION_PLANES_AUDITOR, GESTION_ACCIONES_AUDITOR];
export const FASES_JEFE_DEPENDENCIA = [...PLANEACION_Y_EJECUCION, ASIGNAR_PLANES_AUDITADO, FORMULACION_PLANES_AUDITADO, GESTION_ACCIONES_AUDITADO];
export const MENU_PRINCIPAL = ['Gestión de Auditoría', 'Planes de Mejoramiento'];

// ── Programación (fase 1) ────────────────────────────────────────────────────────────────────

export const PLAN_ANUAL: OpcionFase = {
  menu: ['Gestión de Auditoría', 'Programación', 'Plan Anual de Auditoría'],
  url: '/gestion-auditoria/programacion/plan-auditoria',
  titulo: 'Plan Anual de Auditorías (PAA)',
};

export const ASIGNAR_AUDITORIAS: OpcionFase = {
  menu: ['Gestión de Auditoría', 'Programación', 'Asignar Auditorías'],
  url: '/gestion-auditoria/programacion/asignar-auditorias',
  titulo: 'Asignar Auditorías del Plan Anual de Auditorías (PAA)',
};

export const AUDITORIAS_ESPECIALES: OpcionFase = {
  menu: ['Gestión de Auditoría', 'Programación', 'Registro Auditorías Especiales'],
  url: '/gestion-auditoria/programacion/auditorias-especiales',
  titulo: 'Registro Auditorías Especiales',
};

/** Programación completa: crea y asigna (ROLES_CREACION.PROGRAMACION = ADMIN_SISIFO, AUDITOR_EXPERTO). */
export const PROGRAMACION_COMPLETA = [PLAN_ANUAL, ASIGNAR_AUDITORIAS, AUDITORIAS_ESPECIALES];
/** Programación de quien solo revisa el PAA (Jefe OCI, Secretario). */
export const PROGRAMACION_REVISION = [PLAN_ANUAL];

/** Primer nivel del menú por rol (sondeo del 2026-10-28, ver specs/navegacion-por-fases.plan.md). */
export const MENU_PRINCIPAL_POR_ROL: Record<string, string[]> = {
  'auditor-experto': ['Gestión de Auditoría', 'Gestión de Usuarios', 'Planes de Mejoramiento'],
  'jefe-oci': ['Gestión de Auditoría', 'Gestión de Usuarios'],
  secretario: ['Gestión de Auditoría', 'Planes de Mejoramiento'],
  admin: ['Gestión de Auditoría', 'Gestión de Usuarios', 'Planes de Mejoramiento'],
};
