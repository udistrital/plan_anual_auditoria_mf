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
    [environment.PROGRAMA_ESTADO.BORRADOR_ID]: [
      "Editar Auditoría",
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.PROGRAMA_ESTADO.EN_REVISION_POR_JEFE_ID]: [
      "Ver Auditoría",
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.PROGRAMA_ESTADO.EN_REVISION_POR_AUDITOR_ID]: [
      "Ver Auditoría",
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.PROGRAMA_ESTADO.APROBADO_POR_AUDITOR_ID]: [
      "Ver Auditoría",
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.PROGRAMA_ESTADO.RECHAZADO_ID]: [
      "Editar Auditoría",
      "Ver Documento",
      "Revisar Auditoría",
    ],
  },
  JEFE_CONTROL_INTERNO: {
    [environment.PROGRAMA_ESTADO.BORRADOR_ID]: [
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.PROGRAMA_ESTADO.EN_REVISION_POR_JEFE_ID]: [
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.PROGRAMA_ESTADO.EN_REVISION_POR_AUDITOR_ID]: [
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.PROGRAMA_ESTADO.APROBADO_POR_AUDITOR_ID]: [
      "Ver Documento",
      "Revisar Auditoría",
    ],
    [environment.PROGRAMA_ESTADO.RECHAZADO_ID]: [
      "Ver Documento",
      "Revisar Auditoría",
    ],
  },
  AUDITOR_EXPERTO: {
    [environment.PROGRAMA_ESTADO.BORRADOR_ID]: [
      "Editar Auditoría",
      "Ver Documento",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.PROGRAMA_ESTADO.EN_REVISION_POR_JEFE_ID]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.PROGRAMA_ESTADO.EN_REVISION_POR_AUDITOR_ID]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.PROGRAMA_ESTADO.APROBADO_POR_AUDITOR_ID]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.PROGRAMA_ESTADO.RECHAZADO_ID]: [
      "Editar Auditoría",
      "Ver Documento",
      "Enviar a Aprobación por Jefe",
    ],
  },
  AUDITOR: {
    [environment.PROGRAMA_ESTADO.BORRADOR_ID]: [
      "Editar Auditoría",
      "Ver Documento",
      "Enviar a Aprobación por Jefe",
    ],
    [environment.PROGRAMA_ESTADO.EN_REVISION_POR_JEFE_ID]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.PROGRAMA_ESTADO.EN_REVISION_POR_AUDITOR_ID]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.PROGRAMA_ESTADO.APROBADO_POR_AUDITOR_ID]: [
      "Ver Auditoría",
      "Ver Documento",
    ],
    [environment.PROGRAMA_ESTADO.RECHAZADO_ID]: [
      "Editar Auditoría",
      "Ver Documento",
      "Enviar a Aprobación por Jefe",
    ],
  },
};
