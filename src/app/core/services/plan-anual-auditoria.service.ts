import { Injectable } from "@angular/core";
import { RequestManager } from "../managers/requestManager";

@Injectable({
  providedIn: "root",
})
export class PlanAnualAuditoriaService {
  constructor(private requestManager: RequestManager) {
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

  planilla(endpoint: string) {
    this.requestManager.setPath("PLAN_ANUAL_AUDITORIA_MID");
    return this.requestManager.get(endpoint);
  }
}
