import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { RequestManager } from "../managers/requestManager";

@Injectable({
  providedIn: "root",
})
export class PlanAnualAuditoriaService {
  constructor(private requestManager: RequestManager, private http: HttpClient) {
    this.requestManager.setPath("PLAN_ANUAL_AUDITORIA_SERVICE");
  }
  
  get(endpoint: string) {
    this.requestManager.setPath("PLAN_ANUAL_AUDITORIA_SERVICE");
    return this.requestManager.get(endpoint);
  }

  post(endpoint: string, element: any) {
    this.requestManager.setPath("PLAN_ANUAL_AUDITORIA_SERVICE");
    return this.requestManager.post(endpoint, element);
  }

  put(endpoint: string, element: any) {
    this.requestManager.setPath("PLAN_ANUAL_AUDITORIA_SERVICE");
    return this.requestManager.put(endpoint, element);
  }

  delete(endpoint: string, element: any) {
    this.requestManager.setPath("PLAN_ANUAL_AUDITORIA_SERVICE");
    return this.requestManager.delete(endpoint, element.id);
  }

  deleteWithBody(endpoint: string, body: any) {
    const token = window.localStorage.getItem("access_token");
    const options = {
      headers: new HttpHeaders({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
      body,
    };
    return this.http.delete<any>(`${environment['PLAN_ANUAL_AUDITORIA_SERVICE' as keyof typeof environment]}${endpoint}`, options);
  }

  planilla(endpoint: string) {
    this.requestManager.setPath("PLAN_ANUAL_AUDITORIA_MID");
    return this.requestManager.get(endpoint);
  }
}
