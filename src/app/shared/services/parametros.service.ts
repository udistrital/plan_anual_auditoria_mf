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
    private parametrosService: ParametrosService
  ) {}

  /**
   * Obtiene la lista de vigencias desde el servicio de parámetros.
   * @returns {Observable<any[]>} Observable con el arreglo de vigencias.
   */
   public getVigencias(): Observable<any[]> {
    environment.VIGENCIAS.TIPO_PARAMETRO_ID

    const endpoint = `parametro?query=TipoParametroId:${environment.VIGENCIAS.TIPO_PARAMETRO_ID}&fields=Id,Nombre&limit=0&sortby=nombre&order=desc`;
    
    return this.parametrosService.get(endpoint).pipe(
      map((res: any) => {
        // Validamos que la respuesta contenga Data
        if (res && res.Data) {
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

}
