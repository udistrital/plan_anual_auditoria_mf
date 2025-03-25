import { environment } from "src/environments/environment";

export const accionesProgramacion: {
  [rol: string]: { [estado: number]: string[] };
} = {
  ADMIN_SISIFO: {
    [environment.PLAN_ESTADO.EN_BORRADOR_ID]: [
      "Editar",
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
      "Editar",
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
      "Editar",
      "Enviar Aprobación",
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
      "Editar",
      "Enviar Aprobación",
      "Historial de Rechazo",
      "Registrar Auditorías",
    ],
  },
};

export const accionesPlaneacion: {
  [rol: string]: { [estado: number]: string[] };
} = {
  ADMIN_SISIFO: {
    [environment.AUDITORIA_ESTADO.BORRADOR_ID]: [
      "Editar Auditoría",
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.EN_REVISION_POR_JEFE_ID]: [
      "Ver Auditoría",
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.EN_REVISIÓN_POR_AUDITADO_ID]: [
      "Ver Auditoría",
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.APROBADO_POR_AUDITADO_ID]: [
      "Ver Auditoría",
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.RECHAZADO_ID]: [
      "Editar Auditoría",
      "Ver Documento",
      "Revisar Auditoría",
    ],
  },
  JEFE_CONTROL_INTERNO: {
    [environment.AUDITORIA_ESTADO.BORRADOR_ID]: [
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.EN_REVISION_POR_JEFE_ID]: [
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.EN_REVISIÓN_POR_AUDITADO_ID]: [
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.APROBADO_POR_AUDITADO_ID]: [
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.AUDITORIA_ESTADO.RECHAZADO_ID]: [
      "Ver Documento",
      "Revisar Auditoría",
    ],
  },
  AUDITOR_EXPERTO: {
    [environment.AUDITORIA_ESTADO.BORRADOR_ID]: [
      "Editar Auditoría",
      "Ver Documento",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EN_REVISION_POR_JEFE_ID]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.AUDITORIA_ESTADO.EN_REVISIÓN_POR_AUDITADO_ID]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.AUDITORIA_ESTADO.APROBADO_POR_AUDITADO_ID]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.AUDITORIA_ESTADO.RECHAZADO_ID]: [
      "Editar Auditoría",
      "Ver Documento",
      "Enviar a Aprobación por Jefe",
    ],
  },
  AUDITOR: {
    [environment.AUDITORIA_ESTADO.BORRADOR_ID]: [
      "Editar Auditoría",
      "Ver Documento",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.AUDITORIA_ESTADO.EN_REVISION_POR_JEFE_ID]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.AUDITORIA_ESTADO.EN_REVISIÓN_POR_AUDITADO_ID]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.AUDITORIA_ESTADO.APROBADO_POR_AUDITADO_ID]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.AUDITORIA_ESTADO.RECHAZADO_ID]: [
      "Editar Auditoría",
      "Ver Documento",
      "Enviar a Aprobación por Jefe",
    ],
  },
};
