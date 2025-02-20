import { environment } from "src/environments/environment";

export const accionesProgramacion: {
  [rol: string]: { [estado: number]: string[] };
} = {
  ADMIN_SISIFO: {
    [environment.PLAN_ESTADO.EN_BORRADOR_ID]: [
      "Editar",
      "Ver Plan",
      "Historial de rechazo",
      "Registrar Auditorías",
    ],
    [environment.PLAN_ESTADO.EN_RECHAZO_ID]: [
      "Editar",
      "Ver Plan",
      "Historial de rechazo",
      "Registrar Auditorías",
    ],
    [environment.PLAN_ESTADO.EN_REVISION_JEFE_ID]: [
      "Ver",
      "Ver Plan",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de rechazo",
    ],
    [environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID]: [
      "Ver",
      "Ver Plan",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de rechazo",
    ],
    [environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID]: [
      "Ver",
      "Ver Plan",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de rechazo",
    ],
    [environment.PLAN_ESTADO.RECHAZADO]: [
      "Editar",
      "Ver Plan",
      "Historial de rechazo",
      "Registrar Auditorías",
    ],
  },
  JEFE_CONTROL_INTERNO: {
    [environment.PLAN_ESTADO.EN_BORRADOR_ID]: [],
    [environment.PLAN_ESTADO.EN_RECHAZO_ID]: ["Ver Plan"],
    [environment.PLAN_ESTADO.EN_REVISION_JEFE_ID]: ["Ver Plan"],
    [environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID]: ["Ver Plan"],
    [environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID]: ["Ver Plan"],
    [environment.PLAN_ESTADO.RECHAZADO]: ["Ver Plan"],
  },
  SECRETARIO_AUDITOR: {
    [environment.PLAN_ESTADO.EN_BORRADOR_ID]: [],
    [environment.PLAN_ESTADO.EN_RECHAZO_ID]: ["Ver Plan"],
    [environment.PLAN_ESTADO.EN_REVISION_JEFE_ID]: ["Ver Plan"],
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
    [environment.PLAN_ESTADO.EN_RECHAZO_ID]: [
      "Editar",
      "Enviar Aprobación",
      "Historial de rechazo",
      "Registrar Auditorías",
    ],
    [environment.PLAN_ESTADO.EN_REVISION_JEFE_ID]: [
      "Ver",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de rechazo",
    ],
    [environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID]: [
      "Ver",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de rechazo",
    ],
    [environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID]: [
      "Ver",
      "Ver Auditorias",
      "Ver Documentos",
      "Historial de rechazo",
    ],
    [environment.PLAN_ESTADO.RECHAZADO]: [
      "Editar",
      "Enviar Aprobación",
      "Historial de rechazo",
      "Registrar Auditorías",
    ],
  },
};

export const accionesPlaneacion: {
  [rol: string]: { [estado: number]: string[] };
} = {};
