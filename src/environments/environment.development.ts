export const environment = {
  production: false,

  AUTENTICACION_MID_SERVICE: "https://autenticacion.portaloas.udistrital.edu.co/apioas/autenticacion_mid/v1/",
  GESTOR_DOCUMENTAL_SERVICE: "https://autenticacion.portaloas.udistrital.edu.co/apioas/gestor_documental_mid/v1",
  PARAMETROS_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/parametros/v1/',
  PLAN_ANUAL_AUDITORIA_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/plan_anual_auditoria_crud/v1',
  TERCEROS_SERVICE: "https://autenticacion.portaloas.udistrital.edu.co/apioas/terceros_crud/v1/",
  
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
};
