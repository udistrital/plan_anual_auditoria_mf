import { environment } from "src/environments/environment";

export const accionesProgramacion: {
  [rol: string]: { [estado: number]: string[] };
} = {
  [environment.ROL.ADMIN]: {
    [environment.PLAN_ESTADO.EN_BORRADOR_ID]: [
      "Editar Marco General",
      "Registrar Auditorías",
      "Historial de Rechazo",
    ],
    [environment.PLAN_ESTADO.EN_REVISION_JEFE_ID]: [
      "Ver Marco General",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Rechazo",
    ],
    [environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID]: [
      "Ver Marco General",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Rechazo",
    ],
    [environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID]: [
      "Ver Marco General",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Rechazo",
    ],
    [environment.PLAN_ESTADO.RECHAZADO]: [
      "Editar Marco General",
      "Registrar Auditorías",
      "Historial de Rechazo",
    ],
  },

  [environment.ROL.JEFE]: {
    [environment.PLAN_ESTADO.EN_BORRADOR_ID]: [],
    [environment.PLAN_ESTADO.EN_REVISION_JEFE_ID]: ["Ver Plan", "Editar Auditorías"],
    [environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID]: ["Ver Plan"],
    [environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID]: ["Ver Plan"],
    [environment.PLAN_ESTADO.RECHAZADO]: ["Ver Plan", "Historial de Rechazo",],
  },

  [environment.ROL.SECRETARIO]: {
    [environment.PLAN_ESTADO.EN_BORRADOR_ID]: [],
    [environment.PLAN_ESTADO.EN_REVISION_JEFE_ID]: [],
    [environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID]: ["Ver Plan"],
    [environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID]: ["Ver Plan"],
    [environment.PLAN_ESTADO.RECHAZADO]: ["Ver Plan"],
  },

  [environment.ROL.AUDITOR_EXPERTO]: {
    [environment.PLAN_ESTADO.EN_BORRADOR_ID]: [
      "Editar Marco General",
      "Registrar Auditorías",
      "Enviar Aprobación",
    ],
    [environment.PLAN_ESTADO.EN_REVISION_JEFE_ID]: [
      "Ver Marco General",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Rechazo",
    ],
    [environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID]: [
      "Ver Marco General",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Rechazo",
    ],
    [environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID]: [
      "Ver Marco General",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Rechazo",
    ],
    [environment.PLAN_ESTADO.RECHAZADO]: [
      "Editar Marco General",
      "Registrar Auditorías",
      "Enviar Aprobación",
      "Historial de Rechazo",
    ],
  },
};

export const accionesPlaneacion: {
  [rol: string]: { [estado: number]: string[] };
} = {
  [environment.ROL.ADMIN]: {
    [environment.AUDITORIA_ESTADO.PROGRAMACION.AUDITOR_ASIGNADO]: [
      "Editar Auditoría",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.CREANDO_PROGRAMA]: [
      "Editar Auditoría",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.PROGRAMACION.BORRADOR_ID]: [
      "Editar Auditoría",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE]: [
      "Ver Auditoría",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.RECHAZADO_PROGRAMA_JEFE]: [
      "Editar Auditoría",
      "Revisar Auditoría",
    ],
  },

  [environment.ROL.JEFE]: {
    [environment.AUDITORIA_ESTADO.PROGRAMACION.BORRADOR_ID]: [
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE]: [
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO]: [
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO]: [
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.RECHAZADO_PROGRAMA_JEFE]: [
      "Revisar Auditoría",
    ],
  },

  [environment.ROL.AUDITOR_EXPERTO]: {
    [environment.AUDITORIA_ESTADO.PROGRAMACION.AUDITOR_ASIGNADO]: [
      "Editar Auditoría",
      "Ver Documentos",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.CREANDO_PROGRAMA]: [
      "Editar Auditoría",
      "Ver Documentos",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE]: [
      "Ver Auditoría",
      "Ver Documentos",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Ver Documentos",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Ver Documentos",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.RECHAZADO_PROGRAMA_JEFE]: [
      "Editar Auditoría",
      "Ver Documentos",
      "Enviar a Aprobación por Jefe",
    ],
  },

  [environment.ROL.AUDITOR]: {
    [environment.AUDITORIA_ESTADO.PROGRAMACION.AUDITOR_ASIGNADO]: [
      "Editar Auditoría",
      "Ver Documentos",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.CREANDO_PROGRAMA]: [
      "Editar Auditoría",
      "Ver Documentos",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE]: [
      "Ver Auditoría",
      "Ver Documentos",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Ver Documentos",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Ver Documentos",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.RECHAZADO_PROGRAMA_JEFE]: [
      "Editar Auditoría",
      "Enviar a Aprobación por Jefe",
      "Ver Documentos",
    ],
  },

  [environment.ROL.AUDITOR_ASISTENTE]: {
    [environment.AUDITORIA_ESTADO.PROGRAMACION.AUDITOR_ASIGNADO]: [
      "Editar Auditoría",
      "Ver Documentos",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.CREANDO_PROGRAMA]: [
      "Editar Auditoría",
      "Ver Documentos",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE]: [
      "Ver Auditoría",
      "Ver Documentos",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Ver Documentos",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Ver Documentos",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.RECHAZADO_PROGRAMA_JEFE]: [
      "Editar Auditoría",
      "Ver Documentos",
      "Enviar a Aprobación por Jefe",
    ],
  },

  [environment.ROL.JEFE_DEPENDENCIA]: {
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Revisar Auditoría"
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Ver Documentos"
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.RECHAZADO_PROGRAMA_JEFE]: [
      "Ver Documentos"
    ]
  },

  [environment.ROL.ASISTENTE_DEPENDENCIA]: {
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Revisar Auditoría"
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Ver Documentos"
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.RECHAZADO_PROGRAMA_JEFE]: [
      "Ver Documentos"
    ]
  }
};

// TODO: Ajustar correctamente las acciones de acuerdo al rol y el estado
export const accionesEjecucionPreliminar: {
  [rol: string]: { [estado: number]: string[] };
} = {
  [environment.ROL.ADMIN]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_PREINFORME]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
  },

  [environment.ROL.JEFE]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_PREINFORME]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
  },

  [environment.ROL.AUDITOR_EXPERTO]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_PREINFORME]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
      "Historial de Rechazos",
    ],
  },

  [environment.ROL.AUDITOR]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_PREINFORME]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
  },

  [environment.ROL.AUDITOR_ASISTENTE]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_PREINFORME]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Editar informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
  },

  [environment.ROL.JEFE_DEPENDENCIA]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.POR_EJECUTAR]: [
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_PREINFORME]: [
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE]: [
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_JEFE]: [
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_PREINFORME_JEFE]: [
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO]: [
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO]: [
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO]: [
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
  },

  [environment.ROL.ASISTENTE_DEPENDENCIA]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.POR_EJECUTAR]: [
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_PREINFORME]: [
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE]: [
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_JEFE]: [
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_PREINFORME_JEFE]: [
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO]: [
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO]: [
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO]: [
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
  },
};

// TODO: Ajustar correctamente las acciones de acuerdo al rol y el estado
export const accionesEjecucionFinal: {
  [rol: string]: { [estado: number]: string[] };
} = {
  [environment.ROL.ADMIN]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
      "Historial de Rechazos",
    ],
  },

  [environment.ROL.JEFE]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
      "Historial de Rechazos",
    ],
  },

  [environment.ROL.AUDITOR_EXPERTO]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
      "Historial de Rechazos",
    ],
  },

  [environment.ROL.AUDITOR]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
      "Historial de Rechazos",
    ],
  },

  [environment.ROL.AUDITOR_ASISTENTE]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
      "Historial de Rechazos",
    ],
  },
};