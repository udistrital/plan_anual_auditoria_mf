import { environment } from "src/environments/environment";

export const accionesProgramacion: {
  [rol: string]: { [estado: number]: string[] };
} = {
  ADMIN_SISIFO: {
    [environment.PLAN_ESTADO.EN_BORRADOR_ID]: [
      "Editar Marco General",
      "Historial de Rechazo",
      "Registrar Auditorías",
    ],
    [environment.PLAN_ESTADO.EN_REVISION_JEFE_ID]: [
      "Ver",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Rechazo",
    ],
    [environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID]: [
      "Ver",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Rechazo",
    ],
    [environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID]: [
      "Ver",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Rechazo",
    ],
    [environment.PLAN_ESTADO.RECHAZADO]: [
      "Editar Marco General",
      "Historial de Rechazo",
      "Registrar Auditorías",
    ],
  },

  JEFE_CONTROL_INTERNO: {
    [environment.PLAN_ESTADO.EN_BORRADOR_ID]: [],
    [environment.PLAN_ESTADO.EN_REVISION_JEFE_ID]: ["Ver Plan"],
    [environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID]: ["Ver Plan"],
    [environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID]: ["Ver Plan"],
    [environment.PLAN_ESTADO.RECHAZADO]: ["Ver Plan"],
  },

  SECRETARIO_AUDITOR: {
    [environment.PLAN_ESTADO.EN_BORRADOR_ID]: [],
    [environment.PLAN_ESTADO.EN_REVISION_JEFE_ID]: [],
    [environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID]: ["Ver Plan"],
    [environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID]: ["Ver Plan"],
    [environment.PLAN_ESTADO.RECHAZADO]: ["Ver Plan"],
  },

  AUDITOR_EXPERTO: {
    [environment.PLAN_ESTADO.EN_BORRADOR_ID]: [
      "Editar Marco General",
      "Registrar Auditorías",
      "Enviar Aprobación",
    ],
    [environment.PLAN_ESTADO.EN_REVISION_JEFE_ID]: [
      "Ver",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Rechazo",
    ],
    [environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID]: [
      "Ver",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Rechazo",
    ],
    [environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID]: [
      "Ver",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de Rechazo",
    ],
    [environment.PLAN_ESTADO.RECHAZADO]: [
      "Editar Marco General",
      "Historial de Rechazo",
      "Registrar Auditorías",
      "Enviar Aprobación",
    ],
  },
};

export const accionesPlaneacion: {
  [rol: string]: { [estado: number]: string[] };
} = {
  ADMIN_SISIFO: {
    [environment.AUDITORIA_ESTADO.PROGRAMACION.BORRADOR_ID]: [
      "Editar Auditoría",
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE]: [
      "Ver Auditoría",
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.RECHAZADO_PROGRAMA_JEFE]: [
      "Editar Auditoría",
      "Ver Documento",
      "Revisar Auditoría",
    ],
  },

  JEFE_CONTROL_INTERNO: {
    [environment.AUDITORIA_ESTADO.PROGRAMACION.BORRADOR_ID]: [
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE]: [
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO]: [
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO]: [
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.RECHAZADO_PROGRAMA_JEFE]: [
      "Ver Documento",
      "Revisar Auditoría",
    ],
  },

  AUDITOR_EXPERTO: {
    [environment.AUDITORIA_ESTADO.PROGRAMACION.BORRADOR_ID]: [
      "Editar Auditoría",
      "Ver Documento",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.RECHAZADO_PROGRAMA_JEFE]: [
      "Editar Auditoría",
      "Ver Documento",
      "Enviar a Aprobación por Jefe",
    ],
  },

  AUDITOR: {
    [environment.AUDITORIA_ESTADO.PROGRAMACION.BORRADOR_ID]: [
      "Editar Auditoría",
      "Ver Documento",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.AUDITORIA_ESTADO.PLANEACION.RECHAZADO_PROGRAMA_JEFE]: [
      "Editar Auditoría",
      "Ver Documento",
      "Enviar a Aprobación por Jefe",
    ],
  },
};

// TODO: Ajustar correctamente las acciones de acuerdo al rol y el estado
export const accionesEjecucionPreliminar: {
  [rol: string]: { [estado: number]: string[] };
} = {
  ADMIN_SISIFO: {
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

  JEFE_CONTROL_INTERNO: {
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

  AUDITOR_EXPERTO: {
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

  AUDITOR: {
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
};

// TODO: Ajustar correctamente las acciones de acuerdo al rol y el estado
export const accionesEjecucionFinal: {
  [rol: string]: { [estado: number]: string[] };
} = {
  ADMIN_SISIFO: {
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
    ],
  },

  JEFE_CONTROL_INTERNO: {
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
    ],
  },

  AUDITOR_EXPERTO: {
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
    ],
  },

  AUDITOR: {
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
    ],
  },
};