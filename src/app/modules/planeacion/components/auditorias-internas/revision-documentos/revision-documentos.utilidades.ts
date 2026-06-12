import { environment } from "src/environments/environment";

const configAuditado = {
  estadoAprobacion: environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_AUDITADO,
  preguntaAprobacion: "¿Está seguro(a) de enviar auditoría?",
  mensajeAprobacion: "La auditoria fue enviada al auditor",
  botonAprobacion: "Enviar a Auditor",
  botonFirmar: "Cargar Carta Firmada",
  tooltipFirmar: "Cargar Carta de Representación firmada por el jefe de la dependencia que va a ser auditada"
};

const configJefe = {
  estadoAprobacion: [
    environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_JEFE,
    environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO,
  ],
  preguntaAprobacion: "¿Está seguro(a) de aprobar y enviar auditoría?",
  mensajeAprobacion: "La auditoría fue enviada al auditado (a) responsable",
  botonAprobacion: "Aprobar y enviar a Auditado",
  botonFirmar: "Cargar Oficio Firmado",
  tooltipFirmar: "Cargar Oficio Anuncio Solicitud de Información firmado por el Jefe de la Oficina de Control Interno"
};

export const rolesAprobacion: { [key: string]: any } = {
  [environment.ROL.JEFE]: configJefe,
  [environment.ROL.JEFE_DEPENDENCIA]: configAuditado,
  [environment.ROL.ASISTENTE_DEPENDENCIA]: configAuditado,
};
