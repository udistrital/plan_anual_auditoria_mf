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
  OIKOS_SERVICE:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/oikos_crud_api/v2/",
  TERCEROS_SERVICE:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/terceros_crud/v1/",

  PLANTILLA_CARGUE_MASIVO: "d3094258-3039-4990-9f5c-a3b1c41eb4d2",

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

  VIGENCIAS : {
    TIPO_PARAMETRO_ID: 121,
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
    PROGRAMACION: {
      BORRADOR_ID: 7060,
      POR_ASIGNAR: 7061,
      AUDITOR_ASIGNADO: 7062,
    },
    PLANEACION: {
      CREANDO_PROGRAMA: 7063,
      REVISION_PROGRAMA_JEFE: 7064,
      APROBADO_PROGRAMA_JEFE: 7065,
      RECHAZADO_PROGRAMA_JEFE: 7066,
      REVISION_PROGRAMA_AUDITADO: 7067,
      APROBADO_PROGRAMA_AUDITADO: 7068,
    },
    EJECUCION: {
      // INFORME PRELIMINAR
      POR_EJECUTAR: 7069,
      CREANDO_PREINFORME: 7070,
      REVISION_PREINFORME_JEFE: 7071,
      APROBADO_PREINFORME_JEFE: 7072,
      RECHAZADO_PREINFORME_JEFE: 7073,
      REVISION_PREINFORME_AUDITADO: 7074,
      APROBADO_PREINFORME_AUDITADO: 7075,
      OBSERVACIONES_PREINFORME_AUDITADO: 7076,

      // INFORME FINAL
      CREANDO_INFORME_FINAL: 7077,
      REVISION_INFORME_FINAL_JEFE: 7078,
      APROBADO_INFORME_FINAL_JEFE: 7079,
      RECHAZADO_INFORME_FINAL_JEFE: 7080,
    },
    PLAN_MEJORAMIENTO: {
      SIN_PLAN_MEJORAMIENTO: 7081,
      CREANDO_PLAN_MEJORAMIENTO: 7082,
      REVISION_PLAN_MEJORAMIENTO_AUDITOR: 7083,
      APROBADO_PLAN_MEJORAMIENTO: 7084,
      RECHAZADO_PLAN_MEJORAMIENTO: 7085,
      FIN_PLAN_MEJORAMIENTO: 7086,
    },
  },

  MESES: {
    TIPO_PARAMETRO_ID: 139,
  },

  TIPO_EVALUACION: {
    TIPO_PARAMETRO_ID: 136,
    AUDITORIA_INTERNA_ID: 6770,
    SEGUIMIENTO_ID: 6771,
    INFORME_ID: 6772,
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

  // idsCamposFormulario: {
  //   Objetivo: 6770,
  //   Alcance: 6771,
  //   Criterios: 6772,
  //   Recursos: 6770
  // } as const
};