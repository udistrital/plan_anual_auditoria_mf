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
    private baseUrl = "ruta-base-del-api"; // Cambia esto a la URL base de tu API.

    constructor(
        private http: HttpClient,
        private planAnualAuditoriaService: PlanAnualAuditoriaService,
    ) { }

    guardarReferencia(
        nuxeoResponse: any, // Respuesta de Nuxeo
        referencia_tipo: string, // Tipo de referencia
        tipo_id: number // ID del tipo
    ): Observable<any> {
        const payload = {
            referencia_tipo: referencia_tipo,
            referencia_id: nuxeoResponse.Nombre,
            nuxeo_id: nuxeoResponse.Id,
            nuxeo_enlace: nuxeoResponse.Enlace,
            tipo_id: tipo_id,
            activo: true,
            fecha_creacion: new Date().toISOString(),
        };

        // Verificar si ya existe un registro para la referencia
        return this.planAnualAuditoriaService.get(`documento?referencia_id=${nuxeoResponse.Id}`).pipe(
            switchMap((response: any[]) => {
                if (response && response.length > 0) {
                    const documentoId = response[0].id; // ID del documento existente
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
          .get(`documento?query=referencia_id:${planAuditoriaId},tipo_id:${tipoId}&fields=nuxeo_enlace`)
          .pipe(
            map((response: any) => {
              if (response && response.Data && Array.isArray(response.Data) && response.Data.length > 0) {
                const firstItem = response.Data[0];
                if (firstItem.nuxeo_enlace) {
                  return firstItem.nuxeo_enlace;
                }
              }
              throw new Error('El campo "nuxeo_enlace" no se encontró en la respuesta.');
            }),
            catchError((error) => {
              console.error('Error al consultar el documento:', error);
              return throwError('No se pudo obtener el nuxeo_enlace.');
            })
          );
      }
}
