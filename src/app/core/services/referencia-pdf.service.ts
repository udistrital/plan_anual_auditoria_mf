import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { PlanAnualAuditoriaService } from "./plan-anual-auditoria.service";

export interface DocumentoReferenciaPdf {
  nuxeo_id: number;
  nuxeo_enlace: string;
  tipo_id: number;
  metadatos?: Record<string, any>;
}

export interface ConsultaDocumentosReferenciaOptions {
  referenciaTipo?: string;
  tipo_id?: number;
  fields?: string;
  limit?: number;
}

@Injectable({
  providedIn: "root",
})
export class ReferenciaPdfService {
  constructor(
    private readonly http: HttpClient,
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService
  ) {}

  guardarReferencia(
    nuxeoResponse: any, // Respuesta de Nuxeo
    referencia_tipo: string,
    referencia_id: string,
    tipo_id: number,
    metadatos?: Record<string, any>,
    nuevo: boolean = false
  ): Observable<any> {
    const payload = {
      referencia_tipo: referencia_tipo,
      referencia_id: referencia_id,
      nuxeo_id: nuxeoResponse.Id,
      nuxeo_enlace: nuxeoResponse.Enlace,
      tipo_id: tipo_id,
      metadatos: metadatos || {},
      activo: true,
      fecha_creacion: new Date().toISOString(),
    };

    const queryBase = `referencia_id:${referencia_id},tipo_id:${tipo_id}`;
    const dependenciaId = metadatos?.["dependencia_id"];
    const queryMetadatos =
      typeof dependenciaId === "number"
        ? `,metadatos.dependencia_id:${dependenciaId}<n>`
        : "";

    // Verificar si ya existe un registro para la referencia y metadatos (si aplica)
    return nuevo ? this.planAnualAuditoriaService.post(`documento`, payload) 
      : this.planAnualAuditoriaService
      .get(`documento?query=${queryBase}${queryMetadatos}`)
      .pipe(
        switchMap((response) => {
          if (response && response.Data.length > 0) {
            const documentoId = response.Data[0]._id; // ID del documento existente
            console.log("actualizacion payload", payload);
            return this.planAnualAuditoriaService.put(
              `documento/${documentoId}`,
              payload
            );
          } else {
            return this.planAnualAuditoriaService.post(`documento`, payload);
          }
        })
      );
  }

  consultarDocumento(
    referenciaId: string,
    tipoId: number
  ): Observable<string> {
    return this.planAnualAuditoriaService
      .get(
        `documento?query=referencia_id:${referenciaId},tipo_id:${tipoId},activo:true&fields=nuxeo_enlace`
      )
      .pipe(
        map((response: any) => {
          if (
            response &&
            response.Data &&
            Array.isArray(response.Data) &&
            response.Data.length > 0
          ) {
            const firstItem = response.Data[0];
            if (firstItem.nuxeo_enlace) {
              return firstItem.nuxeo_enlace;
            }
          }
          throw new Error("No se encontró un enlace válido en la respuesta.");
        }),
        catchError((error) => {
          console.error("Error al consultar el documento:", error);
          return "";
        })
      );
  }

  consultarDocumentos(
    referenciaId: string,
    opciones: ConsultaDocumentosReferenciaOptions = {}
  ): Observable<DocumentoReferenciaPdf[]> {
    const fields = opciones.fields ?? "nuxeo_id,nuxeo_enlace,tipo_id,metadatos";
    const limit = opciones.limit ?? 0;
    const tipo = opciones.tipo_id !== undefined ? `tipo_id:${opciones.tipo_id},` : "";

    return this.planAnualAuditoriaService
      .get(
        `documento?query=referencia_id:${referenciaId},${tipo}activo:true&fields=${fields}&limit=${limit}`
      )
      .pipe(
        map((response: any) => {
          if (response && response.Data && Array.isArray(response.Data)) {
            return tipo ? response.Data.filter(
                (item: DocumentoReferenciaPdf) => item?.nuxeo_enlace && item?.tipo_id
              ) : this.filtrarValidos(response.Data);
          }
          throw new Error("No se encontraron enlaces válidos en la respuesta.");
        }),
        catchError((error) => {
          console.error("Error al consultar los documentos:", error);
          return of([]); // Retorna un arreglo vacío en caso de error (of = observable)
        })
      );
  }

  // Filtra los documentos para quedarse solo con el más reciente de cada tipo_id.
  filtrarValidos(documentos: DocumentoReferenciaPdf[]): DocumentoReferenciaPdf[] {
    const mapaMaximos = new Map<number, DocumentoReferenciaPdf>();

    documentos = documentos.filter(
      (item: DocumentoReferenciaPdf) => item?.nuxeo_enlace && item?.tipo_id
    );

    for (const doc of documentos) {
      const existente = mapaMaximos.get(doc.tipo_id);

      if (!existente || doc.nuxeo_id > existente.nuxeo_id) {
        mapaMaximos.set(doc.tipo_id, doc);
      }
    }

    return Array.from(mapaMaximos.values());
  }
}
