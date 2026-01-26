import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import { Observable } from 'rxjs';

/** Endpoint for sending templated emails */
export const TEMPLATED_EMAIL_ENDPOINT = 'email/enviar_templated_email';
/** Name of the template for request emails */
export const PLANTILLA_SOLICITUD_NOMBRE = 'SISIFO_PLANTILLA_SOLICITUD';
/** Name of the template for rejection emails */
export const PLANTILLA_RECHAZO_NOMBRE = 'SISIFO_PLANTILLA_RECHAZO';

/**
 * This service is a wrapper for the NOTIFICACIONES_MID_SERVICE API,
 * using the RequestManager to perform HTTP requests.
 * 
 * It is primarily used to send templated email notifications via
 * `POST` requests to the {@link TEMPLATED_EMAIL_ENDPOINT}.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificacionesMidService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath("NOTIFICACIONES_MID_SERVICE");
  }

  /**
   * Sends a POST request to the specified endpoint of the NOTIFICACIONES_MID_SERVICE.
   * @param {string} endpoint The API endpoint to which the POST request is sent (e.g., {@link TEMPLATED_EMAIL_ENDPOINT}).
   * @param {any} data The payload to be sent in the POST request in JSON format.
   * @returns {Observable<any>} An Observable containing the response from the API.
   */
  post(endpoint: string, data: any): Observable<any> {
    this.requestManager.setPath("NOTIFICACIONES_MID_SERVICE");
    return this.requestManager.post(endpoint, data);
  }

}
