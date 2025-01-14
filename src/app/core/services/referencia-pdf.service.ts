import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { switchMap } from "rxjs/operators";
import { PlanAnualAuditoriaService } from "./plan-anual-auditoria.service";

@Injectable({
  providedIn: "root",
})
export class ReferenciaPdfService {

  constructor(
    private http: HttpClient,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
  ) { }

  guardarReferencia(
    nuxeoResponse: any, // Respuesta de Nuxeo
    referencia_tipo: string, 
    referencia_id: string,
    tipo_id: number 
  ): Observable<any> {
    const payload = {
      referencia_tipo: referencia_tipo,
      referencia_id: referencia_id,
      nuxeo_id: nuxeoResponse.Id,
      nuxeo_enlace: nuxeoResponse.Enlace,
      tipo_id: tipo_id,
      activo: true,
      fecha_creacion: new Date().toISOString(),
    };

    // Verificar si ya existe un registro para la referencia
    return this.planAnualAuditoriaService.get(`documento?query=referencia_id:${referencia_id},tipo_id:${tipo_id}`).pipe(
      switchMap((response) => {
        console.log("referencia data", response)
        if (response && response.Data.length > 0) {
          const documentoId = response.Data[0]._id; // ID del documento existente
          console.log("actualizacion payload", payload)
          return this.planAnualAuditoriaService.put(`documento/${documentoId}`, payload);
        } else {
          return this.planAnualAuditoriaService.post(`documento`, payload);
        }
      })
    );
  }

  consultarDocumento(planAuditoriaId: string, tipoId: number): Observable<string> {
    return this.planAnualAuditoriaService
      .get(`documento?query=referencia_id:${planAuditoriaId},tipo_id:${tipoId},activo:true&fields=nuxeo_enlace`)
      .pipe(
        map((response: any) => {
          if (response && response.Data && Array.isArray(response.Data) && response.Data.length > 0) {
            const firstItem = response.Data[0];
            if (firstItem.nuxeo_enlace) {
              return firstItem.nuxeo_enlace;
            }
          }
          throw new Error('No se encontró un enlace válido en la respuesta.');
        }),
        catchError((error) => {
          console.error('Error al consultar el documento:', error);
          return '';
        })
      );
  }

  consultarDocumentos(planAuditoriaId: string): Observable<{ nuxeo_enlace: string; tipo_id: number }[]> {
    return this.planAnualAuditoriaService
      .get(`documento?query=referencia_id:${planAuditoriaId},activo:true&fields=nuxeo_enlace,tipo_id`)
      .pipe(
        map((response: any) => {
          if (response && response.Data && Array.isArray(response.Data)) {
            return response.Data
              .map((item: { nuxeo_enlace: string; tipo_id: number }) => ({
                nuxeo_enlace: item.nuxeo_enlace,
                tipo_id: item.tipo_id,
              }))
              .filter((item: { nuxeo_enlace: any; tipo_id: any; }) => item.nuxeo_enlace && item.tipo_id);
          }
          throw new Error('No se encontraron enlaces válidos en la respuesta.');
        }),
        catchError((error) => {
          console.error('Error al consultar los documentos:', error);
          return []; // Retorna un arreglo vacío en caso de error
        })
      );
  }
}
