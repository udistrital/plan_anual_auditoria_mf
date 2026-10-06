import { environment } from "src/environments/environment";

const configAuditado = {
  estadoAprobacion: environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO,
  preguntaAprobacion: {
    auditoria: "¿Está seguro(a) de aprobar y enviar esta auditoría?",
    informe: "¿Está seguro(a) de aprobar y enviar este informe de auditoría?",
  },
  mensajeAprobacion: {
    auditoria: "La auditoría fue enviada al auditor",
    informe: "El informe de auditoría fue enviado al auditor",
  },
  botonAprobacion: "Aprobar y enviar",
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
  /** Se usa cuando el Oficio Anuncio Solicitud de información aún no ha sido firmado */
  preguntaAprobacionConFirma: {
    auditoria: "El Oficio Anuncio Solicitud de información no ha sido firmado. Al aprobar, será firmado electrónicamente y la auditoría será enviada al auditado (a) responsable. ¿Está seguro(a) de firmar y enviar la auditoría?",
    informe: "El Oficio Anuncio Solicitud de información no ha sido firmado. Al aprobar, será firmado electrónicamente y el informe de auditoría será enviado al auditado (a) responsable. ¿Está seguro(a) de firmar y enviar el informe de auditoría?",
  },
  botonAprobacion: "Aprobar y enviar",
  botonFirmar: "Firmar Oficio",
  tooltipFirmar: "Aplicar la firma electrónica del Jefe de la Oficina de Control Interno al Oficio Anuncio Solicitud de Información"
};

export const rolesAprobacion: { [key: string]: any } = {
  [environment.ROL.JEFE]: configJefe,
  [environment.ROL.JEFE_DEPENDENCIA]: configAuditado,
  [environment.ROL.ASISTENTE_DEPENDENCIA]: configAuditado,
};

export const documentos = [
  "Oficio Anuncio Solicitud de Información",
  "Compromiso Ético"
];
