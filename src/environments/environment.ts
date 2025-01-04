export const environment = {
  production: false,
  GESTOR_DOCUMENTAL_SERVICE:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/gestor_documental_mid/v1/",
  PARAMETROS_SERVICE:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/parametros/v1/",
  // PLAN_ANUAL_AUDITORIA_SERVICE: "https://autenticacion.portaloas.udistrital.edu.co/apioas/plan_anual_auditoria_crud/v1/",
  PLAN_ANUAL_AUDITORIA_SERVICE: "http://localhost:8080/",  
  PLAN_ANUAL_AUDITORIA_MID: "http://localhost:3001/",

  TERCEROS_SERVICE:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/terceros_crud/v1/",

  AUTENTICACION_MID_SERVICE:
    "https://autenticacion.portaloas.udistrital.edu.co/apioas/autenticacion_mid/v1/",

  PLAN_ESTADO: {
    EN_BORRADOR_ID: 6790,
    EN_RECHAZO_ID: 6806,
    EN_REVISION_JEFE_ID: 6791,
    APROBADO_JEFE_ID: 6792,
    EN_REVISION_SECRETARIO_ID: 6793,
    APROBADO_SECRETARIO_ID: 6794,
    RECHAZADO: 6806,
  },

  TIPO_DOCUMENTO: {
    ACTA_COMITE_COORDINADOR: 179,
    PROGRAMA_TRABAJO_AUDITORIA: 180,
    MATRIZ_FUNCION_PUBLICA: 181,
    PLANTILLAS: 182,
    PLANES_AUDITORIA: 178,
  },

  TIPO_DOCUMENTO_PARAMETOS: {
    ACTA_COMITE_COORDINADOR: 6820,
    MATRIZ_FUNCION_PUBLICA: 6811,
    PLAN_ANUAL_AUDITORIA: 6810,
  },

  // idsCamposFormulario: {
  //   Objetivo: 6770,
  //   Alcance: 6771,
  //   Criterios: 6772,
  //   Recursos: 6770
  // } as const
};
