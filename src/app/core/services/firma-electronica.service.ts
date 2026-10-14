import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { RequestManager } from "../managers/requestManager";

/** Endpoint del servicio de firma electrónica */
export const FIRMA_ELECTRONICA_ENDPOINT = "firma_multiple";

/**
 * Etapa final de la firma: estampa la firma criptográfica y el QR.
 * Debe enviarse como número; el servicio compara `== 3` y con "3" solo estampa el sello
 * sin firma criptográfica, respondiendo 200 igualmente.
 */
export const ETAPA_FIRMA_FINAL = 3;

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
  /** Por defecto {@link ETAPA_FIRMA_FINAL} */
  etapa_firma?: number;
  metadatos: Record<string, any>;
  /** Firmantes que se estampan en el PDF */
  firmantes: FirmanteDocumento[];
  representantes: FirmanteDocumento[];
  /** PDF original en base64 */
  file: string;
}

/**
 * Servicio para firmar electrónicamente documentos PDF usando el FIRMA_SERVICE.
 *
 * El servicio estampa la firma en el PDF, lo sube a Nuxeo y responde con
 * `{ Status, res: { Id, Enlace, ... } }` (respuesta del gestor documental). No incluye el PDF firmado.
 */
@Injectable({
  providedIn: "root",
})
export class FirmaElectronicaService {
  constructor(private readonly requestManager: RequestManager) {
    this.requestManager.setPath("FIRMA_SERVICE");
  }

  firmar(solicitudes: SolicitudFirmaElectronica[]): Observable<any> {
    // En la etapa final el servicio exige metadatos.firmantes y metadatos.representantes, que son
    // los que se guardan en documentos_crud y en Nuxeo; se copian de los que se estampan en el PDF
    const payload = solicitudes.map((solicitud) => ({
      ...solicitud,
      etapa_firma: solicitud.etapa_firma ?? ETAPA_FIRMA_FINAL,
      metadatos: {
        ...solicitud.metadatos,
        firmantes: solicitud.firmantes,
        representantes: solicitud.representantes,
      },
    }));

    this.requestManager.setPath("FIRMA_SERVICE");
    return this.requestManager.post(FIRMA_ELECTRONICA_ENDPOINT, payload);
  }
}
