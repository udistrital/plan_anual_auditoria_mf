import { environment } from "src/environments/environment";

export const accionesProgramacion: {
  [rol: string]: { [estado: number]: string[] };
} = {
  [environment.ROL.ADMIN]: {
    [environment.PLAN_ESTADO.EN_BORRADOR_ID]: [
      "Editar Marco General",
      "Registrar Auditorías",
      "Historial de Observaciones",
    ],
    [environment.PLAN_ESTADO.EN_REVISION_JEFE_ID]: [
      "Ver Marco General",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Observaciones",
    ],
    [environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID]: [
      "Ver Marco General",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Observaciones",
    ],
    [environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID]: [
      "Ver Marco General",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Observaciones",
      "Historial de Ediciones Extraordinarias",
    ],
    [environment.PLAN_ESTADO.RECHAZADO]: [
      "Editar Marco General",
      "Registrar Auditorías",
      "Historial de Observaciones",
    ],
  },

  [environment.ROL.JEFE]: {
    [environment.PLAN_ESTADO.EN_BORRADOR_ID]: [],
    [environment.PLAN_ESTADO.EN_REVISION_JEFE_ID]: [
      "Ver Plan",
      "Editar Auditorías",
      "Historial de Observaciones",
    ],
    [environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID]: [
      "Ver Plan",
      "Historial de Observaciones",
    ],
    [environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID]: [
      "Ver Plan",
      "Historial de Observaciones",
      "Edición Extraordinaria de Auditorías",
      "Historial de Ediciones Extraordinarias",
    ],
    [environment.PLAN_ESTADO.RECHAZADO]: ["Ver Plan", "Historial de Observaciones"],
  },

  [environment.ROL.SECRETARIO]: {
    [environment.PLAN_ESTADO.EN_BORRADOR_ID]: [],
    [environment.PLAN_ESTADO.EN_REVISION_JEFE_ID]: [],
    [environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID]: [
      "Ver Plan",
      "Historial de Observaciones",
    ],
    [environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID]: [
      "Ver Plan",
      "Historial de Observaciones",
    ],
    [environment.PLAN_ESTADO.RECHAZADO]: ["Ver Plan", "Historial de Observaciones"],
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
      "Historial de Observaciones",
    ],
    [environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID]: [
      "Ver Marco General",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Observaciones",
    ],
    [environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID]: [
      "Ver Marco General",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Observaciones",
      "Edición Extraordinaria de Auditorías",
      "Historial de Ediciones Extraordinarias",
    ],
    [environment.PLAN_ESTADO.RECHAZADO]: [
      "Editar Marco General",
      "Registrar Auditorías",
      "Enviar Aprobación",
      "Historial de Observaciones",
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
      "Iniciar Ejecución",
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
      "Iniciar Ejecución",
      "Ver Cartas de representación",
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
      "Ver Cartas de representación",
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
      "Ver Cartas de representación",
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
      "Ver Cartas de representación",
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
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Ver Documentos",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_JEFE]: [
      "Ver Auditoría",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.RECHAZADO_PROGRAMA_JEFE]: [
      "Ver Documentos",
    ],
  },

  [environment.ROL.ASISTENTE_DEPENDENCIA]: {
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Ver Documentos",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_JEFE]: [
      "Ver Auditoría",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.RECHAZADO_PROGRAMA_JEFE]: [
      "Ver Documentos",
    ],
  },
};

export const accionesEjecucionPreliminar: {
  [rol: string]: { [estado: number]: string[] };
} = {
  [environment.ROL.ADMIN]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.POR_EJECUTAR]: [
      "Editar Preinforme",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_PREINFORME]: [
      "Editar Preinforme",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE]: [
      "Ver Preinforme",
      "Ver Documentos del informe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_JEFE]: [
      "Ver Preinforme",
      "Ver Documentos del informe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO]: [
      "Ver Preinforme",
      "Ver Documentos del informe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO]: [
      "Ver Preinforme",
      "Ver Documentos del informe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
      "Historial de Rechazos",
    ],
  },

  [environment.ROL.JEFE]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE]: [
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_JEFE]: [
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO]: [
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO]: [
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_PREINFORME_JEFE]: [
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO]: [
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
  },

  [environment.ROL.AUDITOR_EXPERTO]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_PREINFORME]: [
      "Editar Preinforme",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE]: [
      "Ver Preinforme",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_JEFE]: [
      "Ver Preinforme",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO]: [
      "Ver Preinforme",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO]: [
      "Ver Preinforme",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
      "Historial de Rechazos",
    ],
  },

  [environment.ROL.AUDITOR]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_PREINFORME]: [
      "Editar Preinforme",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE]: [
      "Ver Preinforme",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_JEFE]: [
      "Ver Preinforme",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO]: [
      "Ver Preinforme",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO]: [
      "Ver Preinforme",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
      "Historial de Rechazos",
    ],
  },

  [environment.ROL.AUDITOR_ASISTENTE]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_PREINFORME]: [
      "Editar Preinforme",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE]: [
      "Ver Preinforme",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_JEFE]: [
      "Ver Preinforme",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO]: [
      "Ver Preinforme",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_PREINFORME_JEFE]: [
      "Editar Preinforme",
      "Ver Documentos del informe",
      "Historial de Rechazos",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO]: [
      "Editar Preinforme",
      "Ver Documentos del informe",
      "Historial de Rechazos",
      "Enviar a Aprobación por Jefe",
    ],
  },

  [environment.ROL.JEFE_DEPENDENCIA]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO]: [
      "Ver Documentos del informe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO]: [
      "Ver Documentos del informe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO]: [
      "Ver Documentos del informe",
    ],
  },

  [environment.ROL.ASISTENTE_DEPENDENCIA]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO]: [
      "Ver Documentos del informe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO]: [
      "Ver Documentos del informe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO]: [
      "Ver Documentos del informe",
    ],
  },
};

export const accionesEjecucionFinal: {
  [rol: string]: { [estado: number]: string[] };
} = {
  [environment.ROL.ADMIN]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.POR_EJECUTAR]: [
      "Editar Informe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Historial de Rechazos",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_INFORME_FINAL_JEFE]: [
      "Ver Informe",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_INFORME_FINAL_JEFE]: [
      "Ver Informe",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Historial de Rechazos",
      "Enviar a Aprobación por Jefe",
    ],
  },

  [environment.ROL.JEFE]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_INFORME_FINAL_JEFE]: [
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Historial de Rechazos",
      "Enviar a Aprobación por Jefe",
    ],
  },

  [environment.ROL.AUDITOR_EXPERTO]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_INFORME_FINAL_JEFE]: [
      "Ver Informe",
      "Ver Documentos del informe",
      "Historial de Rechazos",

    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_INFORME_FINAL_JEFE]: [
      "Ver Informe",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Historial de Rechazos",
      "Enviar a Aprobación por Jefe",
    ],
  },

  [environment.ROL.AUDITOR]: {
    [environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_INFORME_FINAL_JEFE]: [
      "Ver Informe",
      "Ver Documentos del informe",
      "Historial de Rechazos",

    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_INFORME_FINAL_JEFE]: [
      "Ver Informe",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Historial de Rechazos",
      "Enviar a Aprobación por Jefe",
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
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Historial de Rechazos",
    ],
    [environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_INFORME_FINAL_JEFE]: [
      "Editar Informe",
      "Ver Documentos del informe",
      "Historial de Rechazos",
      "Enviar a Aprobación por Jefe",
    ],
  },
};