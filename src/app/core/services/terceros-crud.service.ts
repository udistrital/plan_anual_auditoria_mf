import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import { Observable } from 'rxjs';

/**
 * Endpoint for retrieving Tercero Id by identification document.
 * pass the document as the `documento` parameter.
 * @example tercerosCrudService.get(TERCERO_ID_POR_DOCUMENTO_ENDPOINT + `?documento=${documento}`);
 */
export const TERCERO_ID_POR_DOCUMENTO_ENDPOINT = 'tercero/identificacion';

/**
 * This service is a wrapper for the TERCEROS_SERVICE API,
 * using the RequestManager to perform HTTP requests.
 * 
 * It is primarly used to recover Tercero identification data
 * based on identification document using the {@link TERCERO_ID_POR_DOCUMENTO_ENDPOINT}.
 */
@Injectable({
  providedIn: 'root'
})
export class TercerosCrudService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath("TERCEROS_SERVICE");
  }

  /**
   * Sends a GET request to the specified endpoint of the TERCEROS_SERVICE.
   * @param {string} endpoint The API endpoint to which the GET request is sent (e.g., {@link TERCERO_ID_POR_DOCUMENTO_ENDPOINT}).
   * @returns {Observable<any>} An Observable containing the response from the API.
   */
  get(endpoint: string): Observable<any> {
    this.requestManager.setPath("TERCEROS_SERVICE");
    return this.requestManager.get(endpoint);
  }

}
