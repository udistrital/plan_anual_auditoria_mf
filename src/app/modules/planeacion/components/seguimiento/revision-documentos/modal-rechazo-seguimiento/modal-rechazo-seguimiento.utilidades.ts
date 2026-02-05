import { environment } from "src/environments/environment"

export interface TiposMensajeRechazo {
  titulo: string;
  mensaje: string;
  confirmacion: string;
  pregunta: string;
  error: string;
}

export const tiposMensajeRechazo: TiposMensajeRechazo = {
  titulo: "tituloRechazo",
  mensaje: "mensajeRechazo",
  confirmacion: "confirmacionRechazo",
  pregunta: "preguntaRechazo",
  error: "errorRechazo",
}

export const mensajesRechazoPorTipoEvaluacionId: { [key: number]: { [key: string]: string } } = {
  [environment.TIPO_EVALUACION.INFORME_ID]: {
    [tiposMensajeRechazo.titulo]: "Informe rechazado",
    [tiposMensajeRechazo.mensaje]: "El informe de auditoría fue devuelto al auditor(a).",
    [tiposMensajeRechazo.confirmacion]: "¿Está seguro de rechazar este informe de auditoría?",
    [tiposMensajeRechazo.pregunta]: "¿Borrar este informe de auditoría?",
    [tiposMensajeRechazo.error]: "Error al asociar el nuevo estado al informe de auditoría.",
  },
  [environment.TIPO_EVALUACION.SEGUIMIENTO_ID]: {
    [tiposMensajeRechazo.titulo]: "Auditoría rechazada",
    [tiposMensajeRechazo.mensaje]: "La auditoría fue devuelta al auditor(a).",
    [tiposMensajeRechazo.confirmacion]: "¿Está seguro de rechazar esta auditoría?",
    [tiposMensajeRechazo.pregunta]: "¿Borrar esta auditoría?",
    [tiposMensajeRechazo.error]: "Error al asociar el nuevo estado a la auditoría.",
  },
}
