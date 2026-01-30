import { environment } from "src/environments/environment";

export const rolesAprobacion: { [key: string]: any } = {
  jefe: {
    estadoAprobacion: [
      environment.PROGRAMA_ESTADO.APROBADO_PROGRAMA_POR_JEFE_ID,
      environment.PROGRAMA_ESTADO.EN_REVISION_POR_AUDITOR_ID,
    ],
    preguntaAprobacion: "¿Está seguro(a) de aprobar y enviar auditoría?",
    mensajeAprobacion: "La auditoría fue enviada al auditado (a) responsable",
    botonAprobacion: "Aprobar y enviar a Auditado",
  },
  auditado: {
    estadoAprobacion: environment.PROGRAMA_ESTADO.APROBADO_POR_AUDITOR_ID,
    preguntaAprobacion: "¿Está seguro(a) de firmar y enviar auditoría?",
    mensajeAprobacion: "La auditoria fue enviada al auditor",
    botonAprobacion: "Firmar y enviar a Auditor",
  },
};

export const documentos = [
  "Programa de trabajo",
  "Oficio Anuncio Solicitud de Información",
  "Carta de presentación",
  "Compromiso Ético del Auditor Interno",
];
