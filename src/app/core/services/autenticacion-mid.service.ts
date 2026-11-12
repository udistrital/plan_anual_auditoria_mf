import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';

@Injectable({
  providedIn: 'root'
})
export class AutenticacionMidService {

  constructor(private readonly requestManager: RequestManager) {
    this.requestManager.setPath("AUTENTICACION_MID_SERVICE");
  }

  get(endpoint: string) {
    this.requestManager.setPath("AUTENTICACION_MID_SERVICE");
    return this.requestManager.get(endpoint);
  }

  /**
   * Resuelve el documento de un usuario a partir de su correo.
   * POST token/userRol con { user: <correo> }.
   */
  getEmail(endpoint: string, email: string) {
    this.requestManager.setPath("AUTENTICACION_MID_SERVICE");
    return this.requestManager.post(endpoint, { user: email });
  }

  /**
   * Resuelve datos (documento/email) a partir de un número de documento.
   * POST token/documentoToken con { numero: <documento> }.
   */
  getDocumento(endpoint: string, documento: string) {
    this.requestManager.setPath("AUTENTICACION_MID_SERVICE");
    return this.requestManager.post(endpoint, { numero: documento });
  }

  /**
   * Agrega o remueve un rol a un usuario en WSO2.
   * POST rol/add o rol/remove con { rol: <nombreRol>, user: <correo> }.
   */
  postRol(endpoint: string, rol: string, user: string) {
    this.requestManager.setPath("AUTENTICACION_MID_SERVICE");
    return this.requestManager.post(endpoint, { rol, user });
  }
}
