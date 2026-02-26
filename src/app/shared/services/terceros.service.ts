import { Injectable } from "@angular/core";
import { EMPTY, Observable, from, of, throwError } from "rxjs";
import { switchMap, catchError } from "rxjs/operators";
import { ImplicitAutenticationService } from "src/app/core/services/implicit_autentication.service";
import {
  TercerosCrudService,
  TERCERO_ID_POR_DOCUMENTO_ENDPOINT,
} from "../../core/services/terceros-crud.service";
import { DestinatariosEmail } from "./notificaciones.service";

export interface TerceroIdentification {
  Id: number;
  NombreCompleto: string;
}

interface TerceroResponse {
  Identificacion: {
    Numero: string;
    DigitoVerificacion: number;
    TipoDocumentoId: Object;
  },
  Tercero: TerceroIdentification;
};

/**
 * This service provides methods to interact with the TERCEROS_SERVICE API,
 * specifically for retrieving identification data of third parties.
 */
@Injectable({
  providedIn: "root",
})
export class TercerosService {

  constructor(
    private tercerosCrudService: TercerosCrudService,
    private implicitAutenticationService: ImplicitAutenticationService
  ) {}

  /**
   * Retrieve the tercero {@link TerceroIdentification} of the currently authenticated user
   * based on their identification document.
   * 
   * Note: This method assumes that the first Tercero returned by the server is the correct one.
   * @returns {Observable<TerceroIdentification>} An Observable containing the Tercero identification data or {@link EMPTY} if not found.
   * @throws Will throw an error if the user is not authenticated.
   * @throws Will throw an error if the server response is malformed.
   */
  public getAuthenticatedUserTerceroIdentification(): Observable<TerceroIdentification> {
    return from(this.implicitAutenticationService.getDocument()).pipe(

      // Fetch the tercero ID using the user's document
      switchMap((documento: any) => {
        if (!documento)
          return throwError(() => new Error("Usuario no autenticado"));

        console.debug("Fetching tercero for document:", documento);
        const idEndpoint = `${TERCERO_ID_POR_DOCUMENTO_ENDPOINT}?documento=${documento}`;
        return this.tercerosCrudService.get(idEndpoint);
      }),

      // Extract the TerceroIdentification from the response.
      // Expecting the first Tercero to be the correct one.
      switchMap((response: Array<TerceroResponse>) => {
        console.debug("Tercero data retrieved:", response);
        if (!response)
          return EMPTY;

        if (!Array.isArray(response))
          return throwError(() => new Error("Respuesta del servidor malformada"));

        if (response.length === 0)
          return EMPTY;

        if (!response[0].Tercero)
          return throwError(() => new Error("Respuesta del servidor malformada"));

        return of(response[0].Tercero);
      }),

      catchError(err => throwError(() => err))
    );
  }

  /**
   * Retrieve a Tercero by their ID, including UsuarioWSO2 (email).
   * Primarily used to obtain the email of a specific user (e.g. plan creator)
   * when they are not the authenticated user.
   * @param {number} id The Tercero ID (e.g. creado_por_id from plan-auditoria).
   * @returns {Observable<any>} An Observable containing the full Tercero data including UsuarioWSO2.
   */
  public getTerceroById(id: number): Observable<any> {
    return this.tercerosCrudService.get(`tercero/${id}`);
  }

  /**
   * Combines dynamic recipient emails with those defined in the environment,
   * avoiding duplicates across all address types.
   * 
   * The dynamic addresses go to ToAddresses (primary recipients),
   * while the environment addresses are used as CC and BCC (monitoring/testing).
   * @param {string[]} toAddresses Dynamic recipient emails obtained from Terceros API.
   * @param {DestinatariosEmail} envDestinatarios Environment-defined recipients for CC and BCC.
   * @returns {DestinatariosEmail} Combined recipients without duplicates.
   */
  public combinarDestinatarios(
    toAddresses: string[],
    envDestinatarios: DestinatariosEmail
  ): DestinatariosEmail {
    return {
      ToAddresses: [...new Set([
        ...toAddresses,
        ...(envDestinatarios.ToAddresses ?? []),
      ])],
      CcAddresses: [...new Set([
        ...(envDestinatarios.CcAddresses ?? []),
      ])],
      BccAddresses: [...new Set([
        ...(envDestinatarios.BccAddresses ?? []),
      ])],
    };
  }

}