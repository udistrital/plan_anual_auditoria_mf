import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import { Observable } from 'rxjs';

export const NOTIFICACION_REGISTRO_ENDPOINT = 'notificacion';

@Injectable({
  providedIn: 'root'
})
export class NotificacionRegistroCrudService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('PLAN_ANUAL_AUDITORIA_SERVICE');
  }
  
  post(data: any): Observable<any> {
    this.requestManager.setPath('PLAN_ANUAL_AUDITORIA_SERVICE');
    return this.requestManager.post(NOTIFICACION_REGISTRO_ENDPOINT, data);
  }

}