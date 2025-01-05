import { environment } from "src/environments/environment";

export const rolesAprobacion: { [key: string]: any } = {
  jefe: {
    estadoAprobacion:
      environment.AUDITORIA_ESTADO.APROBADO_PROGRAMA_POR_JEFE_ID,
    mensajeAprobacion: "¿Está seguro (a) de aprobar y enviar auditoría?",
  },
  auditor: {
    estadoAprobacion: environment.AUDITORIA_ESTADO.APROBADO_POR_AUDITADO_ID,
    mensajeAprobacion: "¿Está seguro (a) de firmar y enviar auditoría?",
  },
};

export const documentos = [
  "Programa de trabajo",
  "Oficio Anuncio Solicitud de Información",
  "Carta de presentación",
  "Compromiso Ético del Auditor Interno",
];
