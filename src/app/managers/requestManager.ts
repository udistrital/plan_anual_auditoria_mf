import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { HttpErrorManager } from './errorManager';


import { environment } from '../../environments/environment';

/**
 * This class manage the http connections with internal REST services. Use the response format {
 *  Code: 'xxxxx',
 *  Body: 'Some Data' (this element is returned if the request is success)
 *  ...
 * }
 */
@Injectable({
  providedIn: 'root',
})
export class RequestManager {
  private path!: any;
  public httpOptions: any;
  constructor(private http: HttpClient, private errManager: HttpErrorManager) {
    const acces_token = window.localStorage.getItem('access_token');
    if (acces_token !== null) {
      this.httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${acces_token}`,
        }),
      };
    }
  }

  /**
   * Use for set the source path of the service (service's name must be present at src/environment/environment.ts)
   * @param service: string
   */
  public setPath(service: string) {
    this.path = environment[service as keyof typeof environment];
    console.log("el path es:", this.path)
  }

  /**
   * Perform a GET http request
   * @param endpoint service's end-point
   * @param params (an Key, Value object with que query params for the request)
   * @returns Observable<any>
   */
  get(endpoint: string) {
    return this.http.get<any>(`${this.path}${endpoint}`, { ...this.httpOptions, observe: 'body' }).pipe(
      map((res: any) => {  
        if (res.hasOwnProperty('Body')) {
          return res['Body'];
        }
        return res;
      }),
      catchError(this.errManager.handleError.bind(this))
    );
  }

  /**
   * Perform a POST http request
   * @param endpoint service's end-point
   * @param element data to send as JSON
   * @returns Observable<any>
   */
  post(endpoint: string, element: any) {
    return this.http
      .post<any>(`${this.path}${endpoint}`, element, this.httpOptions)
      .pipe(catchError(this.errManager.handleError));
  }

  /**
   * Perform a PUT http request
   * @param endpoint service's end-point
   * @param element data to send as JSON, With the id to UPDATE
   * @returns Observable<any>
   */
  put(endpoint: string, element: { Id: any }) {
    const path = element.Id
      ? `${this.path}${endpoint}/${element.Id}`
      : `${this.path}${endpoint}`;
    return this.http
      .put<any>(path, element, this.httpOptions)
      .pipe(catchError(this.errManager.handleError));
  }
  /**
   * Perform a DELETE http request
   * @param endpoint service's end-point
   * @param id element's id for remove
   * @returns Observable<any>
   */
  delete(endpoint: any, id: any) {
    return this.http
      .delete<any>(`${this.path}${endpoint}/${id}`, this.httpOptions)
      .pipe(catchError(this.errManager.handleError));
  }
}
