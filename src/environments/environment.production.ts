export const environment = {
  production: false,

  AUTENTICACION_MID_SERVICE:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/autenticacion_mid/v1/",
  NOTIFICACIONES_MID_SERVICE:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/notificacion_mid/v1/",
  ORIGEN_CORREO_NOTIFICACIONES:
    "sisifonotificaciones@udistrital.edu.co",
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

  PLANTILLA_CARGUE_MASIVO: "d3094258-3039-4990-9f5c-a3b1c41eb4d2",
  PLANTILLA_CARGUE_MASIVO_ACTIVIDADES: "d3094258-3039-4990-9f5c-a3b1c41eb4d2",

  /** Name for the bulk download file of audits. Excludes file extension. */
  NOMBRE_ARCHIVO_DESCARGA_AUDITORIAS: "Auditorias_PAA",

  /**
   * Destination emails for audit plan notifications.
   * TODO: Add with dependency and chief emails.
   */
  NOTIFICACION_PLAN_AUDITORIA_DESTINATARIOS: {
    /** Direct recipient emails go here */
    ToAddresses: [
      "pruebaspaa266jefe@yopmail.com",
    ],
    /** Carbon copy recipient emails go here */
    CcAddresses: [
      // "copy.to@ejemplo.com"
      "pruebaspaa26@yopmail.com",
    ],
    /** Blind carbon copy recipient emails go here */
    BccAddresses: [
      // "blind.copy.to@ejemplo.com"
    ]
  },

  NOTIFICACION_PLAN_AUDITORIA_RECHAZO_DESTINATARIOS: {
    ToAddresses: [
      "pruebaspaa26auditor@yopmail.com",
    ],
    CcAddresses: [
      "pruebaspaa26@yopmail.com",
    ],
    BccAddresses: []
  },

  NOTIFICACION_PROGRAMA_TRABAJO_ENVIO_JEFE_DESTINATARIOS: {
    ToAddresses: [
      "pruebaspaa266jefe@yopmail.com",
    ],
    CcAddresses: [
      // "copy.to@ejemplo.com"
    ],
    BccAddresses: []
  },

  NOTIFICACION_PROGRAMA_TRABAJO_RECHAZO_JEFE_DESTINATARIOS: {
    ToAddresses: [],
    CcAddresses: [
      // "copy.to@ejemplo.com"
    ],
    BccAddresses: []
  },

  NOTIFICACION_PROGRAMA_TRABAJO_ENVIO_AUDITADO_DESTINATARIOS: {
    ToAddresses: [],
    CcAddresses: [
      // "copy.to@ejemplo.com"
    ],
    BccAddresses: []
  },

  NOTIFICACION_PROGRAMA_TRABAJO_RECHAZO_AUDITADO_DESTINATARIOS: {
    ToAddresses: [],
    CcAddresses: [
      // "copy.to@ejemplo.com"
    ],
    BccAddresses: []
  },

  NOTIFICACION_ACEPTACION_AUDITADO_DESTINATARIOS: {
    ToAddresses: [
      // correos fijos adicionales para pruebas
      "pruebaspaa26auditor@yopmail.com",
    ],
    CcAddresses: [
      // "copy.to@ejemplo.com"
    ],
    BccAddresses: []
  },

  NOTIFICACION_PREINFORME_ENVIO_AUDITADO_DESTINATARIOS: {
    ToAddresses: [
      "pruebaspaa26auditado@yopmail.com",
    ],
    CcAddresses: [],
    BccAddresses: []
  },

  VIGENCIAS: {
    TIPO_PARAMETRO_ID: 100,
  },

  PLAN_ESTADO: {
    EN_BORRADOR_ID: 5261,
    EN_REVISION_JEFE_ID: 5262,
    APROBADO_JEFE_ID: 5263,
    EN_REVISION_SECRETARIO_ID: 5264,
    APROBADO_SECRETARIO_ID: 5265,
    RECHAZADO: 5266,
  },

  AUDITORIA_PADRE_ESTADO: {
    TIPO_PARAMETRO_ID: 111,
    BORRADOR_ID: 5337,
    APROBADA_PAA_ID: 5338,
    CON_MODIFICACION_EXTEMPORANEA_ID: 5339,
    ELIMINADA_ID: 5382,
  },

  AUDITORIA_ESTADO: {
    PROGRAMACION: {
      BORRADOR_ID: 5310,
      POR_ASIGNAR: 5311,
      AUDITOR_ASIGNADO: 5312,
    },
    PLANEACION: {
      CREANDO_PROGRAMA: 5313,
      REVISION_PROGRAMA_JEFE: 5314,
      APROBADO_PROGRAMA_JEFE: 5315,
      RECHAZADO_PROGRAMA_JEFE: 5316,
      REVISION_PROGRAMA_AUDITADO: 5317,
      APROBADO_PROGRAMA_AUDITADO: 5318,
    },
    EJECUCION: {
      POR_EJECUTAR: 5319,
      
      // INFORME PRELIMINAR
      CREANDO_PREINFORME: 5320,
      REVISION_PREINFORME_JEFE: 5321,
      APROBADO_PREINFORME_JEFE: 5322,
      RECHAZADO_PREINFORME_JEFE: 5323,
      REVISION_PREINFORME_AUDITADO: 5324,
      APROBADO_PREINFORME_AUDITADO: 5325,
      OBSERVACIONES_PREINFORME_AUDITADO: 5326,

      // INFORME FINAL
      CREANDO_INFORME_FINAL: 5327,
      REVISION_INFORME_FINAL_JEFE: 5328,
      APROBADO_INFORME_FINAL_JEFE: 5329,
      RECHAZADO_INFORME_FINAL_JEFE: 5330,
    },
    PLAN_MEJORAMIENTO: {
      SIN_PLAN_MEJORAMIENTO: 5331,
      CREANDO_PLAN_MEJORAMIENTO: 5332,
      REVISION_PLAN_MEJORAMIENTO_AUDITOR: 5333,
      APROBADO_PLAN_MEJORAMIENTO: 5334,
      RECHAZADO_PLAN_MEJORAMIENTO: 5335,
      FIN_PLAN_MEJORAMIENTO: 5336,
    },
  },

  MESES: {
    TIPO_PARAMETRO_ID: 102,
  },

  TIPO_EVALUACION: {
    TIPO_PARAMETRO_ID: 101,
    AUDITORIA_INTERNA_ID: 5246,
    SEGUIMIENTO_ID: 5247,
    INFORME_ID: 5248,
  },

  AUDITORIA_FASE: {
    PROGRAMACION: "PROGRAMACION",
    PLANEACION: "PLANEACION",
    EJECUCION_PRELIMINAR: "EJECUCION PRELIMINAR",
    EJECUCION_FINAL: "EJECUCION FINAL",
    PLAN_MEJORAMIENTO: "PLAN DE MEJORAMIENTO",
  },

  TIPO_DOCUMENTO: {
    ACTA_COMITE_COORDINADOR: 179,
    PROGRAMA_TRABAJO_AUDITORIA: 180,
    MATRIZ_FUNCION_PUBLICA: 181,
    PLANTILLAS: 182,
    PLANES_AUDITORIA: 178,
    ACTA_MODIFICACION: 194,
  },

  TIPO_DOCUMENTO_PARAMETROS: {
    ACTA_COMITE_COORDINADOR: 5271,
    MATRIZ_FUNCION_PUBLICA: 5270,
    PLAN_ANUAL_AUDITORIA_ORIGINAL: 5269,
    PLAN_ANUAL_AUDITORIA_ACTUALIZADO: 5273,
    PROGRAMA_TRABAJO: 5275,
    SOLICITUD_INFORMACION: 5276,
    CARTA_PRESENTACION: 5277,
    COMPROMISO_ETICO: 5278,
    INFORME_PRELIMINAR: 5279,
    INFORME_FINAL: 5280,
    ACTA_MODIFICACION_PLAN: 5274,
  },

  INFO_AUDITORIA: {
    TIPOS_PROCESO: {
      ID: 104,
      VALORES: {
        MACROPROCESO: {
          PARAMETRO_ID: 5267,
          TIPO_PARAMETRO_ID: 108,
        },
        PROCESO: {
          PARAMETRO_ID: 5268,
          TIPO_PARAMETRO_ID: 109,
        },
        DEPENDENCIA: {
          PARAMETRO_ID: 5245,
        },
      },
    },
    CARGOS_LIDER_ID: 0,
    CARGOS_RESPONSABLE_ID: 0,
  },

  ROL: {
    ADMIN: "ADMIN_SISIFO",
    JEFE: "JEFE_CONTROL_INTERNO",
    SECRETARIO: "SECRETARIO_AUDITOR",
    AUDITOR_EXPERTO: "AUDITOR_EXPERTO",
    AUDITOR: "AUDITOR",
    AUDITOR_ASISTENTE: "AUDITOR_ASISTENTE",
    JEFE_DEPENDENCIA: "JEFE_DEPENDENCIA",
    ASISTENTE_DEPENDENCIA: "ASISTENTE_DEPENDENCIA",
  },
  ROLES_CREACION: {
    PROGRAMACION: ["ADMIN_SISIFO", "AUDITOR_EXPERTO"],
    PLANEACION: ["ADMIN_SISIFO", "AUDITOR_EXPERTO", "AUDITOR", "AUDITOR_ASISTENTE"],
  },

  CARGO: {
    JEFE_DEPENDENCIA_ID: 312,
    ASISTENTE_DEPENDENCIA_ID: 320,
  },

  DIAS_REVISION_PREINFORME: 3,
};
