import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  NotificacionesMidService,
  TEMPLATED_EMAIL_ENDPOINT,
  PLANTILLA_SOLICITUD_NOMBRE,
  PLANTILLA_RECHAZO_NOMBRE
} from '../../core/services/notificaciones-mid.service';
import { environment } from '../../../environments/environment';


/**
 * Data structure for the body of a templated email request.
 * It includes the sender's email, the template name, and the list of recipients.
 * Each recipient can have their own set of template data for personalization and
 * a list of email addresses to send the email to.
 */
interface CuerpoTemplatedEmail {
  /** Sender email address */
  Source: string;
  /**
   * Name of the template for the email
   * (e.g., {@link PLANTILLA_SOLICITUD_NOMBRE}
   * or {@link PLANTILLA_RECHAZO_NOMBRE})
   */
  Template: string;
  /**
   * Data structure for email recipients and template data.
   * It relates template placeholders with their corresponding values and
   * to a group of recipient email addresses.
   */
  Destinations: [
    {
      /** Data structure for email recipient addresses */
      Destination: DestinatariosEmail;
      /** Data for replacing placeholders in the email template */
      ReplacementTemplateData: VariablesSolicitud | VariablesRechazo;
      // TODO: Attatchments member for the email
    }
  ]
}

/**
 * Data structure for email recipient addresses.
 * It includes arrays for To, CC, and BCC email addresses.  
 */
export interface DestinatariosEmail {
  /** Array of email addresses to send the email to */
  ToAddresses: string[];
  /** Array of email addresses to send a carbon copy (CC) of the email */
  CcAddresses?: string[];
  /** Array of email addresses to send a blind carbon copy (BCC) of the email */
  BccAddresses?: string[];
}

/** Data structure for the variables used in the request notification email template. */
export interface VariablesSolicitud {
  /** Title of the request, usually it includes the the request type and audit process name */
  titulo_solicitud: string;
  /** Type of the request (e.g., approval, rejection, etc.). It can be a list separated by commas */
  tipo_solicitud: string;
  /** Name of the document related to the request */
  nombre_documento: string;
  /** Validity year of the document or request */
  vigencia: string;
  /** Role of the sender */
  rol_remitente: string;
  /** Name of the sender */
  nombre_remitente: string;
  /** Date the request was sent */
  fecha_envio: string;
}

/** Data structure for the variables used in the rejection notification email template. */
export interface VariablesRechazo {
  /** Title of the rejection, usually it includes the audit process name */
  titulo_rechazo: string;
  /** Name of the document related to the request */
  nombre_documento: string;
  /** Validity year of the document or request */
  vigencia: string;
  /** Reason(s) for the rejection */
  motivo_rechazo: string;
  /** Role of the sender */
  rol_remitente: string;
  /** Name of the sender */
  nombre_remitente: string;
  /** Date the rejection was sent */
  fecha_envio: string;
}


/**
 * This service is responsible for sending notification emails
 * related to requests and rejections using the NotificacionesMidService.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {

  constructor(private notificacionesMidService: NotificacionesMidService) {}

  /** Sender email address used for notifications */
  private remitenteEmail = environment['ORIGEN_CORREO_NOTIFICACIONES'];

  /**
   * Send a notification email for a request using the NOTIFICACIONES_MID_SERVICE.
   * @param {DestinatariosEmail} destinatarios List of email recipients (To, CC, BCC).
   * @param {VariablesSolicitud} variables Variables to replace in the request email template.
   * @returns {Observable<any>} An Observable containing the response from the email service.
   */
  public enviarNotificacionSolicitud(
    destinatarios: DestinatariosEmail,
    variables: VariablesSolicitud
  ): Observable<any> {
    const cuerpo: CuerpoTemplatedEmail = {
      Source: this.remitenteEmail,
      Template: PLANTILLA_SOLICITUD_NOMBRE,
      Destinations: [
        {
          Destination: destinatarios,
          ReplacementTemplateData: variables
        }
      ]
    };
        
    return this.notificacionesMidService.post(TEMPLATED_EMAIL_ENDPOINT, cuerpo);
  }

  /**
   * Send a notification email for a rejection using the NOTIFICACIONES_MID_SERVICE.
   * @param {DestinatariosEmail} destinatarios List of email recipients (To, CC, BCC).
   * @param {VariablesRechazo} variables Variables to replace in the rejection email template.
   * @return {Observable<any>} An Observable containing the response from the email service.
   */
  public enviarNotificacionRechazo(
    destinatarios: DestinatariosEmail,
    variables: VariablesRechazo
  ): Observable<any> {
    const cuerpo: CuerpoTemplatedEmail = {
      Source: this.remitenteEmail,
      Template: PLANTILLA_RECHAZO_NOMBRE,
      Destinations: [
        {
          Destination: destinatarios,
          ReplacementTemplateData: variables
        }
      ]
    };

    return this.notificacionesMidService.post(TEMPLATED_EMAIL_ENDPOINT, cuerpo);
  }

}
