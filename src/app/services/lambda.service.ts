import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';

@Injectable({
  providedIn: 'root'
})
export class lambdaService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('LAMBDA_SERVICE');
   }

   post(endpoint: string, element: any) {
    this.requestManager.setPath('LAMBDA_SERVICE');
    return this.requestManager.post(endpoint, element);
    }
}
