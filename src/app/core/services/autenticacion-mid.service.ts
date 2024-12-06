import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';

@Injectable({
  providedIn: 'root'
})
export class AutenticacionMidService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath("AUTENTICACION_MID_SERVICE");
  }

  get(endpoint: string) {
    this.requestManager.setPath("AUTENTICACION_MID_SERVICE");
    return this.requestManager.get(endpoint);
  }
}
