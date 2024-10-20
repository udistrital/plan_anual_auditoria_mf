import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';

@Injectable({
  providedIn: 'root'
})
export class GestorDocumentalService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('GESTOR_DOCUMENTAL_SERVICE');
   }

   postAny(endpoint: string, element: any) {
    this.requestManager.setPath('GESTOR_DOCUMENTAL_SERVICE');
    return this.requestManager.post(endpoint, element);
    }
}
