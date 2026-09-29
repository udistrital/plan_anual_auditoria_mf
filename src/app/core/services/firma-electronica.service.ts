import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { RequestManager } from "../managers/requestManager";

/** Endpoint del servicio de firma electrónica */
export const FIRMA_ELECTRONICA_ENDPOINT = "firma_electronica";

export interface FirmanteDocumento {
  nombre: string;
  cargo: string;
  oficina?: string;
  tipoId: string;
  identificacion: string;
}

export interface SolicitudFirmaElectronica {
  IdTipoDocumento: number;
  nombre: string;
  descripcion: string;
  metadatos: Record<string, any>;
  firmantes: FirmanteDocumento[];
  representantes: FirmanteDocumento[];
  /** PDF original en base64 */
  file: string;
}

/**
 * Servicio para firmar electrónicamente documentos PDF usando el FIRMA_SERVICE.
 *
 * El servicio estampa la firma en el PDF, lo sube a Nuxeo y responde con
 * `{ Status, res: { Id, Enlace, ... }, file }`, donde `file` es el PDF firmado en base64.
 */
@Injectable({
  providedIn: "root",
})
export class FirmaElectronicaService {
  constructor(private readonly requestManager: RequestManager) {
    this.requestManager.setPath("FIRMA_SERVICE");
  }

  firmar(solicitudes: SolicitudFirmaElectronica[]): Observable<any> {
    this.requestManager.setPath("FIRMA_SERVICE");
    return this.requestManager.post(FIRMA_ELECTRONICA_ENDPOINT, solicitudes);
  }
}
