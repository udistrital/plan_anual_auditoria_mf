export const environment = {
    production: false,
    GESTOR_DOCUMENTAL_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/gestor_documental_mid/v1',
    LAMBDA_SERVICE: 'http://localhost:3000',
    PARAMETROS_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/parametros/v1/',


    idsCamposFormulario: {
      Objetivo: 6770,   
      Alcance: 6771,     
      Criterios: 6772, 
      Recursos: 6770    
    } as const 
};