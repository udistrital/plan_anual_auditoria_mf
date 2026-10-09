import { Injectable } from "@angular/core";
import { forkJoin, from, lastValueFrom, Observable, throwError } from "rxjs";
import { map, switchMap, throwIfEmpty } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { FirmaElectronicaService } from "src/app/core/services/firma-electronica.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import type { DocumentoReferenciaPdf } from "src/app/core/services/referencia-pdf.service";
import { AlertService } from "./alert.service";
import { TercerosService } from "./terceros.service";

/** Cargo y oficina con los que firma el usuario autenticado */
export interface CargoFirmante {
  cargo: string;
  oficina?: string;
}

export const CARGO_JEFE_OCI: CargoFirmante = {
  cargo: "Jefe Oficina de Control Interno",
  oficina: "Oficina de Control Interno",
};

/** Documento referenciado que se firma */
export interface DocumentoFirma {
  /** tipo_id con el que se referencia el documento */
  tipoDocumento: number;
  /** Tipo de documento en el gestor documental */
  idTipoDocumento: number;
  /** Nombre del documento con artículo, usado en los mensajes. Ej: "el Informe final" */
  etiqueta: string;
  descripcion: string;
}

export interface DocumentoAuditoriaFirma extends DocumentoFirma {
  /** Prefijo del nombre del PDF firmado; se completa con el consecutivo OCI */
  prefijoNombre: string;
}

export const DOCUMENTOS_AUDITORIA_FIRMA: Record<
  "PROGRAMA_TRABAJO" | "OFICIO_SOLICITUD_INFORMACION" | "INFORME_FINAL",
  DocumentoAuditoriaFirma
> = {
  PROGRAMA_TRABAJO: {
    tipoDocumento: environment.TIPO_DOCUMENTO_PARAMETROS.PROGRAMA_TRABAJO,
    idTipoDocumento: environment.TIPO_DOCUMENTO.PROGRAMA_TRABAJO_AUDITORIA,
    etiqueta: "el Programa de trabajo",
    prefijoNombre: "Programa_Trabajo_Firmado",
    descripcion: "Programa de trabajo de auditoría firmado electrónicamente",
  },
  OFICIO_SOLICITUD_INFORMACION: {
    tipoDocumento: environment.TIPO_DOCUMENTO_PARAMETROS.SOLICITUD_INFORMACION,
    idTipoDocumento: environment.TIPO_DOCUMENTO.PROGRAMA_TRABAJO_AUDITORIA,
    etiqueta: "el Oficio Anuncio Solicitud de información",
    prefijoNombre: "Oficio_Solicitud_Informacion_Firmado",
    descripcion: "Oficio Anuncio Solicitud de información firmado electrónicamente",
  },
  INFORME_FINAL: {
    tipoDocumento: environment.TIPO_DOCUMENTO_PARAMETROS.INFORME_FINAL,
    idTipoDocumento: environment.TIPO_DOCUMENTO.INFORMES,
    etiqueta: "el Informe final",
    prefijoNombre: "Informe_Final_Firmado",
    descripcion: "Informe final de auditoría firmado electrónicamente",
  },
};

export interface SolicitudFirmaDocumento extends DocumentoFirma {
  referenciaId: string;
  referenciaTipo: string;
  /** Nombre del PDF firmado en el gestor documental */
  nombre: string;
  metadatos?: Record<string, any>;
  cargoFirmante: CargoFirmante;
}

/** Extrae el detalle de un error de firma para mostrarlo al usuario */
export function obtenerMensajeErrorFirma(error: any): string {
  // Los errores HTTP traen el detalle en error.error; los errores propios del flujo son instancias de Error
  const detalle = error instanceof Error ? error.message : error?.error?.Error ?? error?.error?.Status;
  return typeof detalle === "string" ? detalle : "";
}

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/**
 * Firma electrónicamente documentos referenciados con los datos del usuario autenticado,
 * reemplazando la referencia del documento por el PDF firmado.
 */
@Injectable({
  providedIn: "root",
})
export class FirmaDocumentoService {
  constructor(
    private readonly firmaElectronicaService: FirmaElectronicaService,
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly nuxeoService: NuxeoService,
    private readonly tercerosService: TercerosService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly alertService: AlertService,
  ) {}

  /**
   * Firma el documento vigente de la referencia. Si ya fue firmado se firma el original
   * para no duplicar firmas.
   */
  firmarDocumento(solicitud: SolicitudFirmaDocumento): Observable<any> {
    const { referenciaId, referenciaTipo, tipoDocumento, etiqueta, cargoFirmante } = solicitud;

    return forkJoin({
      documento: this.consultarDocumento(referenciaId, tipoDocumento),
      firmante: this.tercerosService.getAuthenticatedUserTerceroResponse().pipe(
        throwIfEmpty(() => new Error("No se encontró la información del firmante."))
      ),
    }).pipe(
      switchMap(({ documento, firmante }) => {
        if (!documento)
          return throwError(() => new Error(`No se encontró ${etiqueta}.`));

        const enlaceSinFirma = documento.metadatos?.["firmado"]
          ? documento.metadatos?.["nuxeo_enlace_sin_firma"] ?? documento.nuxeo_enlace
          : documento.nuxeo_enlace;

        return from(this.nuxeoService.obtenerPorUUID(enlaceSinFirma)).pipe(
          switchMap((base64: string) => {
            if (!base64)
              return throwError(() => new Error(`No se pudo obtener ${etiqueta}.`));

            return this.firmaElectronicaService.firmar([{
              IdTipoDocumento: solicitud.idTipoDocumento,
              nombre: solicitud.nombre,
              descripcion: solicitud.descripcion,
              metadatos: solicitud.metadatos ?? {},
              firmantes: [{
                nombre: firmante.Tercero.NombreCompleto,
                ...cargoFirmante,
                tipoId: firmante.Identificacion?.TipoDocumentoId?.CodigoAbreviacion ?? "CC",
                identificacion: firmante.Identificacion?.Numero,
              }],
              representantes: [],
              file: base64,
            }]);
          }),
          switchMap((respuesta: any) => {
            const documentoFirmado = Array.isArray(respuesta?.res) ? respuesta.res[0] : respuesta?.res;
            if (!documentoFirmado?.Id || !documentoFirmado?.Enlace)
              return throwError(() => new Error("Respuesta inválida del servicio de firma electrónica."));

            // Se actualiza el mismo registro para que todas las vistas muestren el documento firmado
            return this.referenciaPdfService.guardarReferencia(
              documentoFirmado,
              referenciaTipo,
              referenciaId,
              tipoDocumento,
              {
                ...documento.metadatos,
                firmado: true,
                nuxeo_enlace_sin_firma: enlaceSinFirma,
              },
              false,
              documento._id
            );
          })
        );
      })
    );
  }

  /** Firma un documento de una auditoría; el nombre y los metadatos se toman de la auditoría */
  firmarDocumentoAuditoria(
    auditoriaId: string,
    documento: DocumentoAuditoriaFirma,
    cargoFirmante: CargoFirmante
  ): Observable<any> {
    return this.planAuditoriaMid.get(`auditoria/${auditoriaId}`).pipe(
      switchMap((res: any) => {
        const auditoria = res?.Data;
        const consecutivoOci = auditoria?.consecutivo_OCI ?? "";
        const { prefijoNombre, ...datosDocumento } = documento;

        return this.firmarDocumento({
          ...datosDocumento,
          referenciaId: auditoriaId,
          referenciaTipo: "Auditoria",
          nombre: `${prefijoNombre}_${consecutivoOci || auditoriaId}`,
          metadatos: {
            auditoria_id: auditoriaId,
            consecutivo_oci: consecutivoOci,
            vigencia: auditoria?.vigencia_nombre ?? "",
          },
          cargoFirmante,
        });
      })
    );
  }

  /**
   * Firma un documento de una auditoría mostrando el error si falla.
   * @returns true si el documento quedó firmado
   */
  firmarDocumentoAuditoriaConAlerta(
    auditoriaId: string,
    documento: DocumentoAuditoriaFirma,
    cargoFirmante: CargoFirmante
  ): Promise<boolean> {
    return this.ejecutarFirma(
      this.firmarDocumentoAuditoria(auditoriaId, documento, cargoFirmante),
      documento.etiqueta
    );
  }

  /**
   * Firma un documento de una auditoría a solicitud del usuario: avisa si ya está firmado,
   * pide confirmación y muestra el resultado.
   * @returns true si el documento quedó firmado
   */
  async aplicarFirmaDocumentoAuditoria(
    auditoriaId: string,
    documento: DocumentoAuditoriaFirma,
    cargoFirmante: CargoFirmante
  ): Promise<boolean> {
    if (await this.estaFirmado(auditoriaId, documento.tipoDocumento)) {
      this.alertService.showAlert(
        "Documento firmado",
        `${capitalizar(documento.etiqueta)} ya fue firmado electrónicamente.`
      );
      return false;
    }

    const confirmado = await this.alertService.showConfirmAlert(
      `Se aplicará su firma electrónica en ${documento.etiqueta}. ¿Desea continuar?`
    );
    if (!confirmado.value) return false;

    const firmado = await this.firmarDocumentoAuditoriaConAlerta(auditoriaId, documento, cargoFirmante);
    if (firmado)
      this.alertService.showSuccessAlert(`${capitalizar(documento.etiqueta)} fue firmado electrónicamente.`);
    return firmado;
  }

  /** Indica si el documento vigente de la referencia ya fue firmado */
  async estaFirmado(referenciaId: string, tipoDocumento: number): Promise<boolean> {
    const documento = await lastValueFrom(this.consultarDocumento(referenciaId, tipoDocumento));
    return !!documento?.metadatos?.["firmado"];
  }

  private consultarDocumento(referenciaId: string, tipoDocumento: number): Observable<DocumentoReferenciaPdf | undefined> {
    return this.referenciaPdfService
      .consultarDocumentos(referenciaId, { tipo_id: tipoDocumento })
      .pipe(map((documentos) => this.referenciaPdfService.filtrarValidos(documentos)[0]));
  }

  private async ejecutarFirma(firma$: Observable<any>, etiqueta: string): Promise<boolean> {
    try {
      await lastValueFrom(firma$);
      return true;
    } catch (error) {
      console.error(error);
      this.alertService.showErrorAlert(
        `Error al firmar electrónicamente ${etiqueta}. ${obtenerMensajeErrorFirma(error)}`
      );
      return false;
    }
  }
}
