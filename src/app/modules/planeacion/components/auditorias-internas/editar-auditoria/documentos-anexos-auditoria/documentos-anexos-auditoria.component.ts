import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { CargarArchivoComponent } from "src/app/shared/elements/components/cargar-archivo/cargar-archivo.component";
import { ModalVerDocumentoComponent } from "src/app/shared/elements/components/dialogs/modal-ver-documento/modal-ver-documento.component";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";
import { ModalVisualizarRecargarCompromisoEticoComponent } from "./modal-visualizar-recargar-compromiso-etico/modal-visualizar-recargar-compromiso-etico.component";

interface CartaRepresentacionDocumento {
  base64: string;
  dependenciaNombre: string;
  dependenciaId: number | null;
  guardado: boolean;
}

interface CartaRepresentacionDocumentoDOCX {
  base64: string;
  dependenciaNombre: string;
  dependenciaId: number | null;
}

interface CartaRepresentacionPersistida {
  nuxeoId: string | null;
  dependenciaNombre: string;
  dependenciaId: number | null;
}

interface DocumentoAdjuntoInicial {
  tipo_id: number;
  nuxeo_enlace?: string;
  nombre?: string;
  metadatos?: Record<string, any>;
}

@Component({
  selector: "app-documentos-anexos-auditoria",
  templateUrl: "./documentos-anexos-auditoria.component.html",
  styleUrls: ["./documentos-anexos-auditoria.component.css"],
})
export class DocumentosAnexosAuditoriaComponent implements OnInit {
  @Output() guardarDocumentos = new EventEmitter<any>();
  @Input() soloLectura: boolean = false;

  auditoriaId: string = "";
  formularioDocumentos: FormGroup;
  idCompromisoEtico: any = null;
  base64CompromisoEtico: any = null;
  documentosExistentes: { [tipoId: number]: string | null } = {};
  cartasRepresentacionEsperadas: CartaRepresentacionDocumento[] = [];
  cartasRepresentacionExistentes: CartaRepresentacionPersistida[] = [];

  documentos = [
    {
      nombre: "Programa de Auditoria",
      plantilla: "programa-auditoria",
      parametro: environment.TIPO_DOCUMENTO_PARAMETROS.PROGRAMA_TRABAJO,
    },
    {
      nombre: "Oficio Anuncio Solicitud de Información",
      plantilla: "solicitud-informacion",
      parametro: environment.TIPO_DOCUMENTO_PARAMETROS.SOLICITUD_INFORMACION,
    },
    {
      nombre: "Cartas de Representación",
      plantilla: "carta-presentacion",
      parametro: environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION,
    },
    {
      nombre: "Compromiso Ético",
      parametro: environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO,
    }
  ];

  constructor(
    private readonly dialog: MatDialog,
    private readonly alertService: AlertService,
    private readonly fb: FormBuilder,
    private readonly nuxeoService: NuxeoService,
    private readonly route: ActivatedRoute,
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly PlanAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService
  ) {
    this.formularioDocumentos = this.fb.group({
      campoDocumentos: ["", Validators.required],
    });
  }

  async ngOnInit() {
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
    await this.cargarCartasRepresentacionEsperadas();
    await this.cargarEstadoDocumentos();
    await this.cargarCompromisoEticoDesdeEstadoInicial();
  }

  private async cargarCartasRepresentacionEsperadas(): Promise<void> {
    try {
      const res = await new Promise<any>((resolve, reject) => {
        this.PlanAnualAuditoriaMid.get(`auditoria/${this.auditoriaId}`).subscribe({
          next: resolve,
          error: reject,
        });
      });

      const auditoria = res?.Data || {};
      const dependenciasIds = Array.isArray(auditoria.dependencia_id) ? auditoria.dependencia_id : [];
      const dependenciasNombres = Array.isArray(auditoria.dependencia_nombre)
        ? auditoria.dependencia_nombre
        : typeof auditoria.dependencia_nombre === "string" && auditoria.dependencia_nombre.length > 0
          ? [auditoria.dependencia_nombre]
          : [];

      this.cartasRepresentacionEsperadas = dependenciasIds.map((dependenciaId: number, index: number) => ({
        base64: "",
        dependenciaId,
        dependenciaNombre: this.normalizarNombreDependencia(
          dependenciasNombres[index],
          `Dependencia ${index + 1}`
        ),
        guardado: false,
      }));
    } catch (error) {
      console.error("Error al cargar dependencias esperadas de cartas", error);
      this.cartasRepresentacionEsperadas = [];
    }
  }

  private async cargarEstadoDocumentos(): Promise<void> {
    try {
      const documentosAdjuntos = await this.buscarDocumentosAdjuntosIniciales();
      const documentosPorTipo = this.agruparDocumentosPorTipo(documentosAdjuntos);

      this.cartasRepresentacionExistentes = [];

      this.documentos.forEach((documento) => {
        const tipoDocumento = documento.parametro;
        const documentosDelTipo = (documentosPorTipo.get(tipoDocumento) ?? []).filter(
          (adjunto) => !!adjunto.nuxeo_enlace
        );

        if (this.esCartaRepresentacion(documento)) {
          const cartasVigentes = documentosDelTipo.map((documentoAdjunto, index) => {
            const dependenciaId =
              typeof documentoAdjunto?.metadatos?.["dependencia_id"] === "number"
                ? (documentoAdjunto.metadatos?.["dependencia_id"] as number)
                : null;

            return {
              nuxeoId: documentoAdjunto.nuxeo_enlace ?? null,
              dependenciaNombre: this.resolverNombreDependencia(
                dependenciaId,
                documentoAdjunto?.nombre,
                index
              ),
              dependenciaId,
            } as CartaRepresentacionPersistida;
          });

          this.cartasRepresentacionExistentes = this.filtrarCartasRepresentacionVigentes(cartasVigentes);

          this.documentosExistentes[tipoDocumento] = this.cartasRepresentacionExistentes[0]?.nuxeoId ?? null;
          return;
        }

        this.documentosExistentes[tipoDocumento] = documentosDelTipo[0]?.nuxeo_enlace ?? null;

        if (tipoDocumento === environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO) {
          this.idCompromisoEtico = this.documentosExistentes[tipoDocumento];
        }
      });
    } catch (error) {
      console.error("Error al cargar documentos adjuntos", error);
      this.cartasRepresentacionExistentes = [];
      this.idCompromisoEtico = null;

      this.documentos.forEach((documento) => {
        this.documentosExistentes[documento.parametro] = null;
      });
    }
  }

  private buscarDocumentosAdjuntosIniciales(): Promise<DocumentoAdjuntoInicial[]> {
    return new Promise((resolve, reject) => {
      this.planAnualAuditoriaService
        .get(
          `documento?query=referencia_id:${this.auditoriaId},referencia_tipo:Auditoria,activo:true&fields=tipo_id,nuxeo_enlace,nombre,metadatos`
        )
        .subscribe(
          (res) => {
            if (res && Array.isArray(res.Data)) {
              resolve(res.Data as DocumentoAdjuntoInicial[]);
              return;
            }

            resolve([]);
          },
          (error: Error) => {
            reject(error);
          }
        );
    });
  }

  private agruparDocumentosPorTipo(
    documentosAdjuntos: DocumentoAdjuntoInicial[]
  ): Map<number, DocumentoAdjuntoInicial[]> {
    return documentosAdjuntos.reduce((mapa, documentoAdjunto) => {
      const tipoId = documentoAdjunto.tipo_id;
      const listaActual = mapa.get(tipoId) ?? [];
      listaActual.push(documentoAdjunto);
      mapa.set(tipoId, listaActual);
      return mapa;
    }, new Map<number, DocumentoAdjuntoInicial[]>());
  }

  existeDocumento(documento: any): boolean {
    if (this.esCartaRepresentacion(documento)) {
      return this.tieneTodasLasCartasGuardadas();
    }

    return !!this.documentosExistentes[documento.parametro];
  }

  esCartaRepresentacion(documento: any): boolean {
    return documento?.parametro === environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION;
  }

  manejarDocumento(documento: any): void {
    if (this.esCartaRepresentacion(documento)) {
      this.verDocumentoGuardado(documento);
      return;
    }

    if (this.existeDocumento(documento)) {
      this.verDocumentoGuardado(documento);
      return;
    }

    this.generarDocumento(documento);
  }

  private async verDocumentoGuardado(documento: any): Promise<void> {
    if (this.esCartaRepresentacion(documento)) {
      await this.verCartasRepresentacionGuardadas(documento);
      return;
    }

    const nuxeoId = this.documentosExistentes[documento.parametro];
    if (!nuxeoId) {
      this.generarDocumento(documento);
      return;
    }

    try {
      const documentoBase64 = await this.nuxeoService.obtenerPorUUID(nuxeoId);
      this.verDocumento(documentoBase64, documento);
    } catch (error) {
      console.error("Error al cargar documento guardado", error);
      this.alertService.showErrorAlert("No fue posible visualizar el documento guardado.");
    }
  }

  private async verCartasRepresentacionGuardadas(documento: any): Promise<void> {
    try {
      const cartasRenderizadas = await this.obtenerCartasRenderizadas(documento);

      const cartas = await Promise.all(
        this.cartasRepresentacionEsperadas.map(async (esperada, index) => {
          const cartaGuardada = this.buscarCartaExistente(esperada.dependenciaId, esperada.dependenciaNombre);
          if (cartaGuardada?.nuxeoId) {
            const base64 = await this.nuxeoService.obtenerPorUUID(cartaGuardada.nuxeoId);
            return {
              base64,
              dependenciaNombre: esperada.dependenciaNombre,
              dependenciaId: esperada.dependenciaId,
              guardado: true,
            } as CartaRepresentacionDocumento;
          }

          const cartaRenderizada = this.buscarCartaRenderizada(
            cartasRenderizadas,
            esperada.dependenciaId,
            esperada.dependenciaNombre,
            index
          );

          return {
            base64: cartaRenderizada?.base64 ?? '',
            dependenciaNombre: esperada.dependenciaNombre,
            dependenciaId: esperada.dependenciaId,
            guardado: false,
          } as CartaRepresentacionDocumento;
        })
      );

      const plantilla = documento.plantilla;
      const idAuditoria = this.auditoriaId;
      let documentosDOCX: any = [];

      this.PlanAnualAuditoriaMid.get(`plantilla/docx/${plantilla}/${idAuditoria}`).subscribe((res) => {
      documentosDOCX = this.mapearCartasDesdeRespuestaPlantilla(res?.Data).map((documentoDOCX) => ({
        ...documentoDOCX
      }));
      this.verDocumentoMultiple(cartas, documento, documentosDOCX);
    });

    } catch (error) {
      console.error("Error al cargar cartas de representación guardadas", error);
      this.alertService.showErrorAlert("No fue posible visualizar las cartas guardadas.");
    }
  }

  /**
   * Busca el nuxeo_enlace del compromiso ético activo y, si existe,
   * obtiene el base64 para mostrarlo. Centraliza la carga inicial y el refresco.
   */
  private async cargarCompromisoEtico(): Promise<void> {
    try {
      if (this.idCompromisoEtico === null) {
        this.idCompromisoEtico = await this.buscarCompromisoEtico();
      }

      if (this.idCompromisoEtico !== null) {
        await this.buscarBase64(this.idCompromisoEtico);
      } else {
        this.base64CompromisoEtico = null;
      }
    } catch (error) {
      console.error("Error al obtener el compromiso ético", error);
    }
  }

  private async cargarCompromisoEticoDesdeEstadoInicial(): Promise<void> {
    try {
      if (this.idCompromisoEtico !== null) {
        await this.buscarBase64(this.idCompromisoEtico);
      } else {
        this.base64CompromisoEtico = null;
      }
    } catch (error) {
      console.error("Error al cargar compromiso ético inicial", error);
    }
  }

  subirCompromisoEtico(): void {
    if (this.soloLectura) {
      return;
    }

    const dialogRef = this.dialog.open(CargarArchivoComponent, {
      width: "800px",
      data: {
        tipoArchivo: "pdf",
        id: this.auditoriaId,
        idTipoDocumento: environment.TIPO_DOCUMENTO.PROGRAMA_TRABAJO_AUDITORIA,
        descripcion: "Compromiso ético de auditoría interna",
        cargaLambda: false,
        tipoIdReferencia: environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO,
        referencia: "Auditoria",
      }
    });

    // Se refresca solo si el documento quedó guardado exitosamente en el backend.
    dialogRef.afterClosed().subscribe((guardadoExitoso: boolean) => {
      if (guardadoExitoso) {
        this.cargarCompromisoEtico();
      }
    });
  }

  buscarCompromisoEtico(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.planAnualAuditoriaService.get(`documento?query=referencia_id:${this.auditoriaId},referencia_tipo:Auditoria,tipo_id:${environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO},activo:true&fields=nuxeo_enlace`)
        .subscribe(
          (res) => {
            if (res && Array.isArray(res.Data) && res.Data.length > 0) {
              resolve(res.Data[0].nuxeo_enlace);
            } else {
              resolve(null);
            }
          },
          (error: Error) => {
            console.log("Error al buscar el compromiso Ético");
            this.alertService.showErrorAlert("Error al buscar Compromiso Ético");
            reject(error);
          }
        );
    });
  }

  async buscarBase64(nuxeoId: string) {
    this.base64CompromisoEtico = await this.nuxeoService.obtenerPorUUID(nuxeoId);
  }

  verCompromisoEtico() {
    const dialogRef = this.dialog.open(ModalVisualizarRecargarCompromisoEticoComponent, {
      data: { base64Document: this.base64CompromisoEtico, id: this.auditoriaId },
      width: "1000px",
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((resultado: boolean | 'deleted') => {
      if (resultado === 'deleted') {
        this.base64CompromisoEtico = null;
        this.idCompromisoEtico = null;
      } else if (resultado === true) {
        this.cargarCompromisoEtico();
      }
    });
  }

  onGuardar() {
    if (this.soloLectura) {
      return;
    }

    if (this.formularioDocumentos.valid) {
      this.guardarDocumentos.emit(this.documentos);
    }
  }

  generarDocumento(documento: any) {
    const plantilla = documento.plantilla;
    const idAuditoria = this.auditoriaId;
    this.PlanAnualAuditoriaMid.get(`plantilla/${plantilla}/${idAuditoria}`).subscribe((res) => {
      if (this.esCartaRepresentacion(documento)) {
        const cartas = this.mapearCartasDesdeRespuestaPlantilla(res?.Data).map((carta) => ({
          ...carta,
          guardado: this.estaCartaGuardada(carta.dependenciaId, carta.dependenciaNombre),
        }));

        this.PlanAnualAuditoriaMid.get(`plantilla/docx/${plantilla}/${idAuditoria}`).subscribe((res) => {
          const documentosDOCX = this.mapearCartasDesdeRespuestaPlantilla(res?.Data).map((documentoDOCX) => ({
            ...documentoDOCX
          }));

          this.verDocumentoMultiple(cartas, documento, documentosDOCX);
          return;
        });
      }

      this.verDocumento(res.Data, documento);
    });
  }

  private verDocumentoMultiple(documentos: CartaRepresentacionDocumento[], infoDocumento: any, documentosDOCX: CartaRepresentacionDocumentoDOCX[]): void {
    const dialogRef = this.dialog.open(ModalVerDocumentoComponent, {
      width: "1200px",
      data: {
        modoMultiple: true,
        documentos: documentos.map((documento) => ({
          titulo: `Carta de Representación ${documento.dependenciaNombre}`,
          base64: documento.base64,
          guardado: documento.guardado,
        })),
        documentosDOCX: documentosDOCX ? documentosDOCX.map((documentoDOCX) => ({
          titulo: `Carta de Representación ${documentoDOCX.dependenciaNombre}`,
          base64: documentoDOCX.base64
        })) : []
      },
      autoFocus: false,
    });

    if (this.soloLectura) {
      return;
    }

    const modalInstance = dialogRef.componentInstance;
    modalInstance.botonGuardar = { icono: "save", texto: "Guardar carta actual" };
    modalInstance.botonGuardarTodos = { icono: "save", texto: "Guardar todas" };
    modalInstance.botonDescargarDOCX = { icono: "download", texto: "Descargar DOCX"};
    modalInstance.onGuardarIndividual = (indice: number) => {
      this.guardarDocumento(
        documentos[indice].base64,
        this.construirInfoCarta(infoDocumento, documentos[indice]),
        () => {
          modalInstance.marcarGuardado(indice);
          this.alertService.showSuccessAlert("Archivo subido exitosamente.");
        },
      );
    };
    modalInstance.onGuardarTodos = () => {
      const items = documentos
        .map((doc, indice) => ({
          indice,
          doc,
          infoDocumento: this.construirInfoCarta(infoDocumento, doc),
        }))
        .filter((item) => item.doc.base64 !== "");

      if (items.length === 0) return;

      const payloads = items.map(({ doc, infoDocumento: info }) => ({
        IdTipoDocumento: environment.TIPO_DOCUMENTO.PROGRAMA_TRABAJO_AUDITORIA,
        nombre: info.nombre,
        descripcion: `Documento pdf (${info.plantilla}) de auditoría de plan de auditoría`,
        file: doc.base64,
      }));

      this.nuxeoService.guardarArchivos(payloads).subscribe({
        next: (responses: any[]) => {
          const fallidas: string[] = [];
          let completadas = 0;
          const total = items.length;

          const verificarCompletado = () => {
            completadas++;
            if (completadas === total) {
              if (fallidas.length > 0) {
                this.alertService.showErrorAlert(
                  `No se pudo guardar la referencia de: ${fallidas.join(", ")}`
                );
              } else {
                this.alertService.showSuccessAlert("Todos los archivos fueron subidos exitosamente.");
              }
            }
          };

          items.forEach(({ indice, infoDocumento: info }, i) => {
            const documentoRefNuxeo = responses[i];
            const enlaceDocumento = documentoRefNuxeo?.res?.Enlace ?? null;

            this.guardarReferencia(
              documentoRefNuxeo,
              "Auditoria",
              this.auditoriaId,
              info.parametro,
              this.esCartaRepresentacion(info) ? { dependencia_id: info.dependenciaId } : undefined,
              () => {
                if (this.esCartaRepresentacion(info)) {
                  const nombreDependencia = this.normalizarNombreDependencia(
                    info.dependenciaNombre,
                    this.resolverNombreDependencia(
                      info.dependenciaId ?? null,
                      info.nombre,
                      this.cartasRepresentacionExistentes.length
                    )
                  );
                  const cartaActualizada = {
                    nuxeoId: enlaceDocumento,
                    dependenciaNombre: nombreDependencia,
                    dependenciaId: info.dependenciaId ?? null,
                  } as CartaRepresentacionPersistida;

                  const indiceCartaExistente = this.cartasRepresentacionExistentes.findIndex((carta) =>
                    this.esMismaDependencia(
                      carta.dependenciaId,
                      carta.dependenciaNombre,
                      cartaActualizada.dependenciaId,
                      cartaActualizada.dependenciaNombre
                    )
                  );

                  if (indiceCartaExistente >= 0) {
                    this.cartasRepresentacionExistentes[indiceCartaExistente] = cartaActualizada;
                  } else {
                    this.cartasRepresentacionExistentes.push(cartaActualizada);
                  }

                  this.documentosExistentes[info.parametro] =
                    this.cartasRepresentacionExistentes[0]?.nuxeoId ?? null;
                } else {
                  this.documentosExistentes[info.parametro] = enlaceDocumento;
                }
                modalInstance.marcarGuardado(indice);
                verificarCompletado();
              },
              () => {
                fallidas.push(info.dependenciaNombre ?? info.nombre);
                verificarCompletado();
              }
            );
          });
        },
        error: (error) => {
          console.error("Error al subir los documentos", error);
        },
      });
    };
    modalInstance.onDescargarDocumentoDOCX = (indice: number) => {
      const base64 = documentosDOCX?.[indice].base64;
      const nombreArchivo = `CARTA DE REPRESENTACION - ${documentosDOCX?.[indice].dependenciaNombre}`;
      this.descargarDocumentoDOCX(base64, nombreArchivo);
    }
  }

  private descargarDocumentoDOCX(base64String: any, nombreDocumento: string) {

    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreDocumento;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    window.URL.revokeObjectURL(url);
  }

  private construirInfoCarta(infoDocumento: any, carta: CartaRepresentacionDocumento): any {
    const nombreDependencia = carta.dependenciaNombre;
    return {
      ...infoDocumento,
      dependenciaId: carta.dependenciaId,
      dependenciaNombre: nombreDependencia,
      nombre: `${infoDocumento.nombre} - ${nombreDependencia}`,
      plantilla: `${infoDocumento.plantilla}-${nombreDependencia.toLowerCase().replace(/\s+/g, "-")}`,
    };
  }

  verDocumento(documentoBase64: any, infoDocumento: any) {
    const dialogRef = this.dialog.open(ModalVerDocumentoComponent, {
      width: "1000px",
      data: documentoBase64,
      autoFocus: false,
    });

    if (!this.soloLectura) {
      const modalInstance = dialogRef.componentInstance;
      modalInstance.botonGuardar = { icono: "save", texto: "Guardar documento" };
    }

    dialogRef.afterClosed().subscribe((res) => {
      if (!res) return;

      if (!this.soloLectura && res.accion === "guardarDocumento") {
        this.guardarDocumento(
          documentoBase64,
          infoDocumento,
          () => this.alertService.showSuccessAlert("Archivo subido exitosamente."),
        );
      }
    });
  }

  guardarDocumento(
    documentoBase64: any,
    infoDocumento: any,
    onSuccess?: () => void,
  ) {
    if (this.soloLectura) {
      return;
    }

    if (documentoBase64 !== "") {
      const payload = {
        IdTipoDocumento: environment.TIPO_DOCUMENTO.PROGRAMA_TRABAJO_AUDITORIA,
        nombre: infoDocumento.nombre,
        descripcion:
          "Documento pdf (" +
          infoDocumento.plantilla +
          ") de auditoría de plan de auditoría",
        file: documentoBase64,
      };

      this.nuxeoService.guardarArchivos([payload]).subscribe({
        next: (response: any) => {
          const documentoRefNuxeo = response[0];
          const enlaceDocumento = documentoRefNuxeo?.res?.Enlace ?? null;

          this.guardarReferencia(
            documentoRefNuxeo,
            "Auditoria",
            this.auditoriaId,
            infoDocumento.parametro,
            this.esCartaRepresentacion(infoDocumento)
              ? { dependencia_id: infoDocumento.dependenciaId, firmado: false }
              : undefined,
            () => {
              if (this.esCartaRepresentacion(infoDocumento)) {
                const nombreDependencia = this.normalizarNombreDependencia(
                  infoDocumento.dependenciaNombre,
                  this.resolverNombreDependencia(
                    infoDocumento.dependenciaId ?? null,
                    infoDocumento.nombre,
                    this.cartasRepresentacionExistentes.length
                  )
                );
                const cartaActualizada = {
                  nuxeoId: enlaceDocumento,
                  dependenciaNombre: nombreDependencia,
                  dependenciaId: infoDocumento.dependenciaId ?? null,
                } as CartaRepresentacionPersistida;

                const indiceCartaExistente = this.cartasRepresentacionExistentes.findIndex((carta) =>
                  this.esMismaDependencia(
                    carta.dependenciaId,
                    carta.dependenciaNombre,
                    cartaActualizada.dependenciaId,
                    cartaActualizada.dependenciaNombre
                  )
                );

                if (indiceCartaExistente >= 0) {
                  this.cartasRepresentacionExistentes[indiceCartaExistente] = cartaActualizada;
                } else {
                  this.cartasRepresentacionExistentes.push(cartaActualizada);
                }

                this.documentosExistentes[infoDocumento.parametro] =
                  this.cartasRepresentacionExistentes[0]?.nuxeoId ?? null;
              } else {
                this.documentosExistentes[infoDocumento.parametro] = enlaceDocumento;
              }

              onSuccess?.();
            }
          );
        },
        error: (error) => {
          console.error("Error al subir el documento", error);
        },
      });
    }
  }

  guardarReferencia(
    nuxeoResponse: any,
    referencia_tipo: string,
    referencia_id: string,
    tipo_id: number,
    metadatos?: Record<string, any>,
    onSuccess?: () => void,
    onError?: () => void
  ): void {
    if (nuxeoResponse.res.Enlace) {
      this.referenciaPdfService
        .guardarReferencia(
          nuxeoResponse.res,
          referencia_tipo,
          referencia_id,
          tipo_id,
          metadatos
        )
        .subscribe({
          next: (response) => {
            onSuccess?.();
          },
          error: (error) => {
            console.error("Error al guardar la referencia", error);
            onError?.();
          },
        });
    }
  }

  private mapearCartasDesdeRespuestaPlantilla(data: any): CartaRepresentacionDocumento[] {
    if (Array.isArray(data)) {
      return data.map((item: any, index: number) => ({
        base64: item?.base64 ?? '',
        dependenciaNombre: this.normalizarNombreDependencia(
          item?.dependencia_nombre,
          this.resolverNombreDependencia(
            typeof item?.dependencia_id === "number" ? item.dependencia_id : null,
            undefined,
            index
          )
        ),
        dependenciaId: typeof item?.dependencia_id === "number" ? item.dependencia_id : null,
        guardado: false,
      }));
    }

    return [
      {
        base64: data ?? '',
        dependenciaNombre: "Dependencia 1",
        dependenciaId: null,
        guardado: false,
      },
    ];
  }

  private estaCartaGuardada(dependenciaId: number | null, dependenciaNombre: string): boolean {
    return !!this.buscarCartaExistente(dependenciaId, dependenciaNombre);
  }

  private filtrarCartasRepresentacionVigentes(
    cartas: CartaRepresentacionPersistida[]
  ): CartaRepresentacionPersistida[] {
    if (!this.cartasRepresentacionEsperadas.length) {
      return [];
    }

    return cartas.filter((carta) =>
      this.cartasRepresentacionEsperadas.some((esperada) => {
        if (carta.dependenciaId !== null && esperada.dependenciaId !== null) {
          return carta.dependenciaId === esperada.dependenciaId;
        }

        return carta.dependenciaNombre === esperada.dependenciaNombre;
      })
    );
  }

  private tieneTodasLasCartasGuardadas(): boolean {
    if (!this.cartasRepresentacionEsperadas.length) {
      return false;
    }

    return this.cartasRepresentacionEsperadas.every((esperada) =>
      !!this.buscarCartaExistente(esperada.dependenciaId, esperada.dependenciaNombre)
    );
  }

  private async obtenerCartasRenderizadas(documento: any): Promise<CartaRepresentacionDocumento[]> {
    const dependenciasFaltantes = this.cartasRepresentacionEsperadas.filter(
      (esperada) => !this.buscarCartaExistente(esperada.dependenciaId, esperada.dependenciaNombre)
    );

    if (!dependenciasFaltantes.length) {
      return [];
    }

    const plantilla = documento.plantilla;
    const idAuditoria = this.auditoriaId;
    const respuestaPlantilla = await new Promise<any>((resolve, reject) => {
      this.PlanAnualAuditoriaMid.get(`plantilla/${plantilla}/${idAuditoria}`).subscribe({
        next: resolve,
        error: reject,
      });
    });

    return this.mapearCartasDesdeRespuestaPlantilla(respuestaPlantilla?.Data);
  }

  private buscarCartaRenderizada(
    cartasRenderizadas: CartaRepresentacionDocumento[],
    dependenciaId: number | null,
    dependenciaNombre: string,
    index: number
  ): CartaRepresentacionDocumento | undefined {
    const encontradaPorDependencia = cartasRenderizadas.find((carta) =>
      this.esMismaDependencia(
        carta.dependenciaId,
        carta.dependenciaNombre,
        dependenciaId,
        dependenciaNombre
      )
    );

    if (encontradaPorDependencia) {
      return encontradaPorDependencia;
    }

    return cartasRenderizadas[index];
  }

  private buscarCartaExistente(
    dependenciaId: number | null,
    dependenciaNombre: string
  ): CartaRepresentacionPersistida | undefined {
    return this.cartasRepresentacionExistentes.find((cartaGuardada) =>
      this.esMismaDependencia(
        cartaGuardada.dependenciaId,
        cartaGuardada.dependenciaNombre,
        dependenciaId,
        dependenciaNombre
      )
    );
  }

  private esMismaDependencia(
    dependenciaAId: number | null,
    dependenciaANombre: string,
    dependenciaBId: number | null,
    dependenciaBNombre: string
  ): boolean {
    if (dependenciaAId !== null && dependenciaBId !== null) {
      return dependenciaAId === dependenciaBId;
    }

    return dependenciaANombre === dependenciaBNombre;
  }

  private extraerNombreDependencia(nombreDocumento: string | undefined, index: number): string {
    const fallback = `Dependencia ${index + 1}`;

    if (typeof nombreDocumento === "string" && nombreDocumento.includes(" - ")) {
      const partes = nombreDocumento.split(" - ");
      return this.normalizarNombreDependencia(partes[partes.length - 1], fallback);
    }

    return fallback;
  }

  private resolverNombreDependencia(
    dependenciaId: number | null,
    nombreDocumento: string | undefined,
    index: number
  ): string {
    if (dependenciaId !== null) {
      const esperada = this.cartasRepresentacionEsperadas.find(
        (carta) => carta.dependenciaId === dependenciaId
      );
      if (esperada?.dependenciaNombre) {
        return this.normalizarNombreDependencia(
          esperada.dependenciaNombre,
          this.extraerNombreDependencia(nombreDocumento, index)
        );
      }
    }

    return this.extraerNombreDependencia(nombreDocumento, index);
  }

  private normalizarNombreDependencia(nombre: unknown, fallback: string): string {
    const nombreLimpio = typeof nombre === "string" ? nombre.trim() : "";

    if (!nombreLimpio) {
      return fallback;
    }

    if (/^\d+$/.test(nombreLimpio)) {
      return fallback;
    }

    return nombreLimpio;
  }
}
