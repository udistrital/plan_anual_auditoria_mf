export const environment = {
  production: false,
  GESTOR_DOCUMENTAL_SERVICE:
    'https://autenticacion.portaloas.udistrital.edu.co/apioas/gestor_documental_mid/v1',
  PARAMETROS_SERVICE:
    'https://autenticacion.portaloas.udistrital.edu.co/apioas/parametros/v1/',
  PLAN_ANUAL_AUDITORIA_SERVICE: 'http://localhost:3000',
  TERCEROS_SERVICE:
    'https://autenticacion.portaloas.udistrital.edu.co/apioas/terceros_crud/v1/',
    PLAN_ANUAL_AUDITORIA_MID: 'http://localhost:3001',
  PLAN_ESTADO: {
    EN_BORRADOR_ID: 6790,
    EN_REVISION_JEFE_ID: 6791,
    APROBADO_JEFE_ID: 6792,
    APROBADO_SECRETARIO_ID: 6794,
  },
  // idsCamposFormulario: {
  //   Objetivo: 6770,
  //   Alcance: 6771,
  //   Criterios: 6772,
  //   Recursos: 6770
  // } as const
};
