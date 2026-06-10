import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { ParametrosService } from "../../core/services/parametros.service";
import { environment } from "src/environments/environment";

export interface Parametro {
  Id: number;
  Nombre: string;
}

/**
 * This service provides methods to interact with the TERCEROS_SERVICE API,
 * specifically for retrieving identification data of third parties.
 */
@Injectable({
  providedIn: "root",
})
export class ParametrosUtilsService {

  constructor(
    private readonly parametrosService: ParametrosService
  ) {}

  /**
   * Obtiene la lista de vigencias desde el servicio de parámetros.
   * @returns {Observable<any[]>} Observable con el arreglo de vigencias.
   */
   public getVigencias(): Observable<any[]> {
    const endpoint = `parametro?query=TipoParametroId:${environment.VIGENCIAS.TIPO_PARAMETRO_ID},Activo:true&fields=Id,Nombre&limit=0&sortby=nombre&order=desc`;
    
    return this.parametrosService.get(endpoint).pipe(
      map((res: any) => {
        // Validamos que la respuesta contenga Data
        if (res?.Data) {
          return res.Data;
        }
        return [];
      }),
      catchError(err => {
        console.error("Error cargando vigencias:", err);
        return throwError(() => new Error("No se pudieron cargar las vigencias"));
      })
    );
  }

  /**
   * Obtiene estados de auditoría filtrados por un rango de IDs.
   *
   * @param desdeId ID inicial del rango
   * @param hastaId ID final del rango
   * @returns Observable con los estados encontrados
   */
  public getEstadosAuditoria(
    desdeId: number = environment.AUDITORIA_ESTADO.PROGRAMACION.BORRADOR_ID,
    hastaId: number = environment.AUDITORIA_ESTADO.EJECUCION.POR_EJECUTAR
  ): Observable<Parametro[]> {
    const tipoParametroId = environment.AUDITORIA_ESTADO.TIPO_PARAMETRO_ID;
    let query = `TipoParametroId:${tipoParametroId},Activo:true`;

    // Agregar filtros por rango si existen
    if (desdeId !== undefined) {
      query += `,Id__gte:${desdeId}`;
    }

    if (hastaId !== undefined) {
      query += `,Id__lte:${hastaId}`;
    }

    const endpoint =
      `parametro?query=${query}&fields=Id,Nombre&limit=0&sortby=Id&order=asc`;

    return this.parametrosService.get(endpoint).pipe(
      map((res: any) => {
        if (res?.Data) {
          return res.Data.map((estado: any) => ({
            Id: estado.Id,
            Nombre: estado.Nombre,
          }));
        }

        return [];
      }),

      catchError((err) => {
        console.error("Error cargando estados de auditoría:", err);

        return throwError(
          () => new Error("No se pudieron cargar los estados de auditoría")
        );
      })
    );
  }

}
