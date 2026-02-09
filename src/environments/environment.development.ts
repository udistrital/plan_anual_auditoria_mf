export const environment = {
  production: false,

  AUTENTICACION_MID_SERVICE:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/autenticacion_mid/v1/",
  NOTIFICACIONES_MID_SERVICE:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/notificacion_mid/v1/",
  ORIGEN_CORREO_NOTIFICACIONES:
    "notificacionPolux@udistrital.edu.co",
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

  PLANTILLA_CARGUE_MASIVO: "8e51a50e-9b80-4c93-a917-20b958fd3d2b",

  /** Name for the bulk download file of audits. Excludes file extension. */
  NOMBRE_ARCHIVO_DESCARGA_AUDITORIAS: "Auditorias_PAA",

  /**
   * Destination emails for audit plan notifications.
   * TODO: Add with dependency and chief emails.
   */
  NOTIFICACION_PLAN_AUDITORIA_DESTINATARIOS: {
    /** Direct recipient emails go here */
    ToAddresses: [
      // "send.to@ejemplo.com"
    ],
    /** Carbon copy recipient emails go here */
    CcAddresses: [
      // "copy.to@ejemplo.com"
    ],
    /** Blind carbon copy recipient emails go here */
    BccAddresses: [
      // "blind.copy.to@ejemplo.com"
    ]
  },

  PLAN_ESTADO: {
    EN_BORRADOR_ID: 6790,
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
    APROBADO_INFORME_FINAL_ID: 7058,
  },

  INFORME_ESTADO: {
    // INFORME PRELIMINAR
    INFORME_PRELIMINAR_CREANDO_ID: 7070,
    INFORME_PRELIMINAR_EN_REVISION_POR_JEFE_ID: 7071,
    INFORME_PRELIMINAR_APROBADO_POR_JEFE_ID: 7072,
    INFORME_PRELIMINAR_RECHAZADO_POR_JEFE_ID: 7073,
    INFORME_PRELIMINAR_EN_REVISION_POR_AUDITADO_ID: 7074,
    INFORME_PRELIMINAR_APROBADO_POR_AUDITADO_ID: 7075,
    INFORME_PRELIMINAR_RESPUESTA_POR_AUDITADO_ID: 7076,
    // INFORME FINAL
    INFORME_FINAL_CREANDO_ID: 7077,
    INFORME_FINAL_EN_REVISION_POR_JEFE_ID: 7078,
    INFORME_FINAL_APROBADO_POR_JEFE_ID: 7079,
    INFORME_FINAL_RECHAZADO_POR_JEFE_ID: 7080
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

  ROLES: [
    "ADMIN_SISIFO",
    "JEFE_CONTROL_INTERNO",
    "SECRETARIO_AUDITOR",
    "AUDITOR_EXPERTO",
    "AUDITOR",
  ],
  ROLES_CREACION: {
    PROGRAMACION: ["ADMIN_SISIFO", "AUDITOR_EXPERTO"],
    PLANEACION: ["ADMIN_SISIFO", "AUDITOR_EXPERTO", "AUDITOR"],
  },
};
