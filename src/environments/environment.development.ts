export const environment = {
  production: false,

  AUTENTICACION_MID_SERVICE:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/autenticacion_mid/v1/",
  GESTOR_DOCUMENTAL_SERVICE:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/gestor_documental_mid/v1/",
  PARAMETROS_SERVICE:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/parametros/v1/",
  PLAN_ANUAL_AUDITORIA_SERVICE:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/plan_anual_auditoria_crud/v1/",
  PLAN_ANUAL_AUDITORIA_MID:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/plan_anual_auditoria_mid/v1/",
  TERCEROS_SERVICE:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/terceros_crud/v1/",
  OIKOS_SERVICE:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/oikos_crud_api/v2/",

  PLANTILLA_CARGUE_MASIVO: "f0c3d702-b5e8-46ff-8f0b-0c9c7511276c",

  PLAN_ESTADO: {
    EN_BORRADOR_ID: 6790,
    EN_RECHAZO_ID: 6806,
    EN_REVISION_JEFE_ID: 6791,
    APROBADO_JEFE_ID: 6792,
    EN_REVISION_SECRETARIO_ID: 6793,
    APROBADO_SECRETARIO_ID: 6794,
    RECHAZADO: 6806,
  },

  AUDITORIA_ESTADO: {
    BORRADOR_ID: 6823,
    EN_REVISION_POR_JEFE_ID: 6824,
    APROBADO_PROGRAMA_POR_JEFE_ID: 6825,
    EN_REVISIÓN_POR_AUDITADO_ID: 6826,
    APROBADO_POR_AUDITADO_ID: 6827,
    RECHAZADO_ID: 6828,
  },

  TIPO_DOCUMENTO: {
    ACTA_COMITE_COORDINADOR: 179,
    PROGRAMA_TRABAJO_AUDITORIA: 180,
    MATRIZ_FUNCION_PUBLICA: 181,
    PLANTILLAS: 182,
    PLANES_AUDITORIA: 178,
  },

  TIPO_DOCUMENTO_PARAMETROS: {
    ACTA_COMITE_COORDINADOR: 6820,
    MATRIZ_FUNCION_PUBLICA: 6811,
    PLAN_ANUAL_AUDITORIA: 6810,
    PROGRAMA_TRABAJO: 6812,
    SOLICITUD_INFORMACION: 6813,
    CARTA_PRESENTACION: 6814,
    COMPROMISO_ETICO: 6815,
  },

  INFO_AUDITORIA: {
    TIPOS_PROCESO: {
      ID: 140,
      VALORES: {
        MACROPROCESO: {
          PARAMETRO_ID: 6796,
          TIPO_PARAMETRO_ID: 148,
        },
        PROCESO: {
          PARAMETRO_ID: 6797,
          TIPO_PARAMETRO_ID: 149,
        },
        DEPENDENCIA: {
          PARAMETRO_ID: 6798,
        },
      },
    },
    CARGOS_LIDER_ID: 150,
    CARGOS_RESPONSABLE_ID: 151,
  },

  ROLES_CONSULTA: ["JEFE_CONTROL_INTERNO"],
  ROLES_CONSULTA_EDICION: ["ADMIN_SISIFO", "AUDITOR_EXPERTO"],
};
