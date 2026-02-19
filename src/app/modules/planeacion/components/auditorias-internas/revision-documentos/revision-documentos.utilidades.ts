import { environment } from "src/environments/environment";

export const rolesAprobacion: { [key: string]: any } = {
  jefe: {
    estadoAprobacion: [
      environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_JEFE,
      environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO,
    ],
    preguntaAprobacion: "¿Está seguro(a) de aprobar y enviar auditoría?",
    mensajeAprobacion: "La auditoría fue enviada al auditado (a) responsable",
    botonAprobacion: "Aprobar y enviar a Auditado",
  },
  auditado: {
    estadoAprobacion: environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO,
    preguntaAprobacion: "¿Está seguro(a) de firmar y enviar auditoría?",
    mensajeAprobacion: "La auditoría fue enviada al auditor",
    botonAprobacion: "Firmar y enviar a Auditor",
  },
};

export const documentos = [
  "Programa de trabajo",
  "Oficio Anuncio Solicitud de Información",
  "Carta de presentación",
  "Compromiso Ético del Auditor Interno",
];
