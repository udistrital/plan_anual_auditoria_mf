import { Injectable } from "@angular/core";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { ModalVerDocumentosComponent, TabDocumento } from "src/app/shared/elements/components/dialogs/modal-ver-documentos/modal-ver-documentos.component";
import { catchError, concatMap, firstValueFrom, map, Observable, of, throwError } from "rxjs";

/**
 * Servicio de utilidades para la gestión de documentos PDF relacionados con el plan de auditoría, incluyendo generación, almacenamiento y referencia de documentos.
 */
@Injectable({
  providedIn: "root",
})
export class DocumentoUtils {

  constructor(
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly nuxeoService: NuxeoService,
    private readonly planAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly alertaService: AlertService,
    private readonly matDialog: MatDialog,
  ) {}

  /**
   * Maneja el proceso completo de actualización del formato PAA para un plan de auditoría específico, incluyendo la generación del PDF, su almacenamiento en el sistema y la actualización de la interfaz de usuario con los nuevos documentos.
   * 
   * Muestra alertas de éxito o error según corresponda durante el proceso.
   * @param planId El ID del plan de auditoría para el cual se actualizará el formato PAA.
   * @param dialogRef Una referencia al diálogo que muestra los documentos, para actualizar la información mostrada después de la actualización del formato PAA.
   * @param conEspeciales Un booleano que indica si se deben incluir caracteres especiales en el PDF generado.
   * @returns Una promesa que se resuelve cuando el proceso de actualización se completa.
   */
  async handleActualizarDocumento(
    planId: string,
    urlGeneracion: string,
    dialogRef: MatDialogRef<ModalVerDocumentosComponent, unknown> | null,
    tipoDocumentoId: number,
  ): Promise<void> {
    try {
      await this.actualizarDocumento(planId, urlGeneracion, tipoDocumentoId);
      this.alertaService.showSuccessAlert("Formato PAA actualizado exitosamente.")
        .then(() => {
          dialogRef?.componentInstance.ngOnInit();
        });
    } catch (error) {
      this.alertaService.showErrorAlert("Error al actualizar el formato PAA.");
      console.error("Error al actualizar el formato PAA:", error);
    }
  }

  /**
   * Actualiza el formato PAA de un plan de auditoría específico generando un nuevo PDF y guardándolo en el sistema. 
   * @param planId El ID del plan de auditoría para el cual se actualizará el formato PAA.
   * @param urlGeneracion La URL del servicio que genera el PDF.
   * @param tipoDocumentoId El ID del tipo de documento que se está actualizando.
   * @returns Una promesa que se resuelve cuando el proceso de actualización se completa.
   * @throws Error si ocurre algún problema durante la generación o almacenamiento del PDF.
   */
  async actualizarDocumento(planId: string, urlGeneracion: string, tipoDocumentoId: number): Promise<void> {
    const documentoBase64 = await this.generarPdf(urlGeneracion);
    await firstValueFrom(this.guardarYReferenciarPdf(documentoBase64, planId, tipoDocumentoId));
  }

  /**
   * Genera un PDF para un plan de auditoría específico utilizando el servicio PlanAnualAuditoriaMid.
   * @param planId El ID del plan de auditoría para el cual se generará el PDF.
   * @param conEspeciales Un booleano que indica si se deben incluir caracteres especiales en el PDF generado.
   * @returns Una promesa que se resuelve con el contenido del PDF en formato Base64.
   * @throws Error si ocurre algún problema durante la generación del PDF.
   */
  async generarPdf(url: string): Promise<string> {
    return await firstValueFrom(
      this.planAnualAuditoriaMid.get(url).pipe(
        map((response: any): string => {
          console.debug("Respuesta recibida del servicio de generación de PDF", response);
          if (response && response.Data)
            return response.Data;

          throw new Error("Respuesta inválida del servicio de generación de PDF")
        }),
        catchError((error: Error) => throwError(() =>
          new Error(`Error al generar el PDF: ${error.message}`, error)
        )),
      )
    );
  }

  /**
   * Guarda un PDF generado en el sistema utilizando el servicio NuxeoService y luego crea una referencia al documento guardado utilizando ReferenciaPdfService.
   * @param base64 El contenido del PDF en formato Base64 que se desea guardar.
   * @param planId El ID del plan de auditoría al que se asociará el PDF guardado.
   * @throws Error si ocurre algún problema durante el proceso de guardado o creación de la referencia.
   */
  guardarYReferenciarPdf(base64: string, planId: string, tipoDocumentoId: number): Observable<boolean> {
    console.debug("Iniciando proceso de guardado y referencia del PDF para el planId:", planId);
    if (base64 === "")
      return throwError(() => new Error("El contenido del PDF está vacío, no se puede guardar ni referenciar."));

    const payload = {
      IdTipoDocumento: environment.TIPO_DOCUMENTO.PLANES_AUDITORIA,
      nombre: planId,
      descripcion: "Documento pdf, auditorias de plan de auditoria con anexo",
      metadatos: {},
      file: base64,
    };

    return this.nuxeoService.guardarArchivos([payload]).pipe(
      map((response: any[]): any => {
        console.debug("Archivo PDF guardado exitosamente, respuesta del servicio NuxeoService", response);
        if (!Array.isArray(response) || response.length === 0)
          throw new Error("No se recibió una respuesta válida al guardar el documento en Nuxeo.");

        const documento = response[0];
        if (!documento)
          throw new Error("No se recibió información del documento guardado en Nuxeo.");

        console.debug("Documento subido exitosamente", documento);
        return documento;
      }),
      concatMap((documento: any): Observable<boolean> =>
        this.guardarReferencia(
          documento,
          "Plan Auditoria",
          planId,
          tipoDocumentoId,
        )
      ),
      map((guardarReferenciaExitoso: boolean): boolean => {
        if (guardarReferenciaExitoso)
          return true;

        throw new Error("El archivo se subió pero no se pudo guardar la referencia en el sistema.");
      }),
      catchError((error) => {
        return throwError(() =>
          new Error(`Error al intentar guardar y referenciar el PDF: ${error.message}`, error)
        );
      }),
    )
    
  }

  /**
   * Guarda una referencia a un documento PDF en el sistema utilizando el servicio ReferenciaPdfService.
   * @param nuxeoResponse La respuesta del servicio NuxeoService que contiene la información del documento guardado.
   * @param referencia_tipo El tipo de referencia que se está guardando (por ejemplo, "Plan Auditoria").
   * @param referencia_id El ID del plan de auditoría al que se asociará la referencia del documento.
   * @param tipo_id El ID del tipo de documento que se está referenciando.
   * @return Un Observable que se resuelve con un booleano indicando si la referencia se guardó exitosamente o no.
   */
  guardarReferencia(
    nuxeoResponse: any,
    referencia_tipo: string,
    referencia_id: string,
    tipo_id: number
  ): Observable<boolean> {
    console.debug("Intentando guardar referencia para el documento", nuxeoResponse);
    if (!nuxeoResponse || !nuxeoResponse.res || !nuxeoResponse.res.Enlace)
      return of(false);
    
    return this.referenciaPdfService
      .guardarReferencia(
        nuxeoResponse.res,
        referencia_tipo,
        referencia_id,
        tipo_id
      )
      .pipe(
        map((response): boolean => {
          console.debug("Referencia guardada exitosamente", response);
          return true;
        }),
        catchError((error) => throwError(() =>
          new Error(
            `Error al guardar la referencia del documento: ${error.message}`,
            error
          )
        ))
      )
  }

  /**
    * Genera las tabs para visualizar los documentos asociados a un plan de auditoría, determinando qué documentos mostrar y qué acciones permitir dependiendo del estado del plan y los roles del usuarios.
    * @param planId El ID del plan de auditoría para el cual se generarán las tabs de documentos.
    * @param planEstado El estado actual del plan de auditoría, utilizado para determinar qué documentos mostrar.
    * @param roles Los roles del usuario actual, utilizados para determinar qué documentos mostrar y qué acciones permitir.
    * @param dialogRefHolder Un objeto que contiene una referencia al diálogo de visualización de documentos, utilizado para actualizar el contenido del diálogo después de realizar acciones como la actualización del formato PAA.
    * @returns Un array de objetos TabDocumento que representan las tabs a mostrar en el diálogo de visualización de documentos.
   */
  getTabsVerDocumentos(
    planId: string,
    planEstado: number,
    roles?: string[],
    dialogRefHolder?: { ref: MatDialogRef<any> | null }
  ): TabDocumento[] {
    const formatoPaaActualizadoTab: TabDocumento = {
      nombre: "Formato PAA Actualizado",
      tipoId: environment.TIPO_DOCUMENTO_PARAMETROS.PLAN_ANUAL_AUDITORIA_ACTUALIZADO,
      botones: dialogRefHolder ? [
        {
          nombre: "Actualizar Documento",
          accion: () => this.handleActualizarDocumento(
            planId,
            `Plantilla/${planId}?conEspeciales=true`,
            dialogRefHolder.ref,
            environment.TIPO_DOCUMENTO_PARAMETROS.PLAN_ANUAL_AUDITORIA_ACTUALIZADO
          ),
          icono: "update",
        },
      ] : undefined,
    };
    const formatoPaaOriginalTab: TabDocumento = {
      nombre: "Formato PAA Original",
      tipoId: environment.TIPO_DOCUMENTO_PARAMETROS.PLAN_ANUAL_AUDITORIA_ORIGINAL
    };
    const matrizFuncionPublicaTab: TabDocumento = {
      nombre: "Matriz Función Pública",
      tipoId: environment.TIPO_DOCUMENTO_PARAMETROS.MATRIZ_FUNCION_PUBLICA
    };
    const actaComiteTab: TabDocumento = {
      nombre: "Acta de Comité",
      tipoId: environment.TIPO_DOCUMENTO_PARAMETROS.ACTA_COMITE_COORDINADOR,
    };

    let tabs = [];
    if (planEstado === environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID) {
      tabs = [formatoPaaActualizadoTab, formatoPaaOriginalTab, matrizFuncionPublicaTab];

      if (!roles || roles.length === 0) {
        tabs.push(actaComiteTab);
      } else {
        const rolesActaComite = [
          environment.ROL.AUDITOR_EXPERTO,
          environment.ROL.JEFE,
          environment.ROL.SECRETARIO
        ];
        if (roles.some(role => rolesActaComite.includes(role))) {
          tabs.push(actaComiteTab);
        }
      }
    } else {
      tabs = [formatoPaaOriginalTab, formatoPaaActualizadoTab];
    }
    return tabs;
  }

  /**
   * Abre un modal para ver los documentos asociados a un plan de auditoría.
   * @param planId El ID del plan de auditoría.
   * @param planEstado El estado del plan de auditoría.
   * @param planVigenciaNombre El nombre de la vigencia del plan de auditoría.
   * @param roles Los roles del usuario actual, para determinar qué documentos mostrar en el modal.
   */
  verDocumentos(
    planId: string,
    planEstado: number,
    planVigenciaNombre: string,
    roles: string[]
  ): void {
    // Se utiliza un objeto para mantener la referencia al diálogo abierto, lo que permite actualizar su contenido después de realizar acciones como la actualización del formato PAA.
    const dialogRefHolder: {
      ref: MatDialogRef<ModalVerDocumentosComponent> | null
    } = { ref: null };

    // Filtrar las tabs a mostrar dependiendo del estado del plan y los roles del usuario
    const tabs = this.getTabsVerDocumentos(planId, planEstado, roles, dialogRefHolder);

    dialogRefHolder.ref = this.matDialog.open(ModalVerDocumentosComponent, {
      width: "1200px",
      data: {
        entityId: planId,
        descripcion: `Documentos asociados al Plan Anual de Auditoría - Vigencia ${planVigenciaNombre}`,
        tabs: tabs,
      },
    });
  }


}
