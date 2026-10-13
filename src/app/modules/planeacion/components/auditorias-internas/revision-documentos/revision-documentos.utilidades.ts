import { environment } from "src/environments/environment";

const configAuditado = {
  estadoAprobacion: environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO,
  preguntaAprobacion: "¿Está seguro(a) de enviar auditoría?",
  mensajeAprobacion: "La auditoria fue enviada al auditor",
  botonAprobacion: "Enviar a Auditor",
  botonFirmar: "Cargar Carta Firmada",
  iconoFirmar: "upload_file",
  tooltipFirmar: "Cargar Carta de Representación firmada por el jefe de la dependencia que va a ser auditada"
};

const configJefe = {
  estadoAprobacion: [
    environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_JEFE,
    environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO,
  ],
  preguntaAprobacion: "¿Está seguro(a) de aprobar y enviar la auditoría al auditado (a) responsable?",
  /** Se usa cuando el Oficio Anuncio Solicitud de información aún no ha sido firmado */
  preguntaAprobacionConFirma: "El Oficio Anuncio Solicitud de información no ha sido firmado. Al aprobar, será firmado electrónicamente y la auditoría será enviada al auditado (a) responsable. ¿Está seguro(a) de firmar y enviar la auditoría?",
  mensajeAprobacion: "La auditoría fue enviada al auditado (a) responsable",
  botonAprobacion: "Aprobar y enviar a Auditado",
  botonFirmar: "Firmar Oficio",
  iconoFirmar: "draw",
  tooltipFirmar: "Aplicar la firma electrónica del Jefe de la Oficina de Control Interno al Oficio Anuncio Solicitud de Información"
};

export const rolesAprobacion: { [key: string]: any } = {
  [environment.ROL.JEFE]: configJefe,
  [environment.ROL.JEFE_DEPENDENCIA]: configAuditado,
  [environment.ROL.ASISTENTE_DEPENDENCIA]: configAuditado,
};
