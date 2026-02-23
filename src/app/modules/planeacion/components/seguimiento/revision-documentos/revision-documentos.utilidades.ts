import { environment } from "src/environments/environment";

const configAuditado = {
  estadoAprobacion: environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO,
  preguntaAprobacion: {
    auditoria: "¿Está seguro(a) de firmar y enviar auditoría?",
    informe: "¿Está seguro(a) de firmar y enviar informe de auditoría?",
  },
  mensajeAprobacion: {
    auditoria: "La auditoría fue enviada al auditor",
    informe: "El informe de auditoría fue enviado al auditor",
  },
  botonAprobacion: "Firmar y enviar",
};

const configJefe = {
  estadoAprobacion: [
    environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_JEFE,
    environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO,
  ],
  preguntaAprobacion: {
    auditoria: "¿Está seguro(a) de aprobar y enviar auditoría?",
    informe: "¿Está seguro(a) de aprobar y enviar informe de auditoría?",
  },
  mensajeAprobacion: {
    auditoria: "La auditoría fue enviada al auditado (a) responsable",
    informe: "El informe de auditoría fue enviado al auditado (a) responsable",
  },
  botonAprobacion: "Aprobar y enviar",
};

export const rolesAprobacion: { [key: string]: any } = {
  [environment.ROL.JEFE]: configJefe,
  [environment.ROL.JEFE_DEPENDENCIA]: configAuditado,
  [environment.ROL.ASISTENTE_DEPENDENCIA]: configAuditado,
};

export const documentos = [
  "Oficio Anuncio Solicitud de Información",
];
