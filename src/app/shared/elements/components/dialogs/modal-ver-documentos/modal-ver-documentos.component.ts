import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { lastValueFrom } from "rxjs";
import { environment } from "src/environments/environment";

//servicios
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { DocumentoReferenciaPdf, ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { CargarArchivoComponent } from "src/app/shared/elements/components/cargar-archivo/cargar-archivo.component";

interface DocumentoModal extends DocumentoReferenciaPdf {
  base64: string;
}

export interface BotonTabDocumentoContext {
  tab: TabDocumento;
  selectedTab: number;
  documento?: DocumentoReferenciaPdf;
  refresh: () => Promise<void>;
}

export interface BotonTabDocumento {
  nombre: string;
  accion: (context?: BotonTabDocumentoContext) => void | Promise<void>;
  color?: string;
  icono?: string;
  estilo?: string;
  tipo?: 'flat' | 'stroked' | 'raised' | 'basic'; // Tipo de botón
}

export interface CargueAdjuntoTabConfig {
  nombreBoton?: string;
  iconoBoton?: string;
  colorBoton?: string;
  estiloBoton?: string;
  tipoBoton?: 'flat' | 'stroked' | 'raised' | 'basic'; // Tipo de botón
  tipoArchivo?: "pdf" | "xlsx";
  idTipoDocumento: number;
  descripcion: string;
  referenciaTipoFallback?: string;
  metadatosAdicionales?: Record<string, any>;
  onSuccess?: (context: BotonTabDocumentoContext) => void | Promise<void>;
}

export interface TabDocumento {
  nombre: string;
  tipoId: number;
  fecha_subida?: string;
  obligatorio?: boolean;
  botones?: BotonTabDocumento[];
  documentoId?: string;
  matcherMetadatos?: Record<string, any>;
  cargueAdjuntoConfig?: CargueAdjuntoTabConfig;
}

export interface ModalVerDocumentosData {
  entityId: string;
  titulo?: string;
  descripcion?: string;
  sufijo?: string;
  tabs?: TabDocumento[];
  inferTabs?: boolean;
  tipo?: number;
  textoBotonCerrar?: string;
  accionesFooter?: AccionFooterModal[];
}

export interface AccionFooterModal {
  nombre: string;
  icono?: string;
  color?: string;
  tipoBoton?: 'flat' | 'stroked' | 'raised' | 'basic'; // Tipo de botón
  accion: () => boolean | Promise<boolean>;
}

@Component({
  selector: "app-modal-ver-documentos",
  templateUrl: "./modal-ver-documentos.component.html",
  styleUrl: "./modal-ver-documentos.component.css",
})
export class ModalVerDocumentosComponent implements OnInit {
  selectedTab: number = 0;
  documentos: DocumentoModal[] = [];
  documentosPorTab: { [key: number]: string } = {};
  documentoInfoPorTab: { [key: number]: DocumentoModal } = {};

  titulo: string = "Ver documentos";
  descripcion: string = "Documentos";
  suffix: string = "";
  textoBotonCerrar: string = "Regresar";
  consultarPorTipo: boolean = false;
  tabs: TabDocumento[] = [];
  accionesFooter: AccionFooterModal[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ModalVerDocumentosData,
    public dialogRef: MatDialogRef<ModalVerDocumentosComponent>,
    private readonly matDialog: MatDialog,
    private readonly alertService: AlertService,
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly nuxeoService: NuxeoService,
    private readonly descargaService: DescargaService
  ) {
    if (data.titulo) this.titulo = data.titulo;
    if (data.descripcion) this.descripcion = data.descripcion;
    if (data.tabs) this.tabs = data.tabs;
    if (data.textoBotonCerrar) this.textoBotonCerrar = data.textoBotonCerrar;
    if (data.accionesFooter) this.accionesFooter = data.accionesFooter;
    if (data.tipo) this.consultarPorTipo = true;
    if (data.sufijo) {
      this.suffix = data.sufijo ? data.sufijo : '';
    }
  }

  async ngOnInit() {
    await this.recargarContenido();
  }

  async recargarContenido(): Promise<void> {
    try {
      this.documentos = [];
      this.documentosPorTab = {};
      this.documentoInfoPorTab = {};
      await this.cargarDocumentos();
      if (this.data.inferTabs)
        this.inferirPestanasDeDocumentos();
      await this.renderizarDocumentos();
    } catch (error) {
      console.error("Error al inicializar los documentos:", error);
    }
  }

  /**
   * Loads documents associated with the given entity ID.
   */
  async cargarDocumentos() {
    try {
      const tieneTabsConDocumentoId = this.tabs.some((tab) => !!tab.documentoId);
      const opciones = this.consultarPorTipo
        ? { tipo_id: this.data.tipo }
        : { deduplicarPorTipo: !tieneTabsConDocumentoId };
      const enlacesConTipo = await lastValueFrom(
        this.referenciaPdfService.consultarDocumentos(this.data.entityId, opciones)
      );

      const enlaces = enlacesConTipo.map((doc) => doc.nuxeo_enlace);
      const base64Files = await this.nuxeoService.obtenerPorUUIDs(enlaces);

      enlacesConTipo.forEach((doc, index) => {
        const base64 = base64Files[index];
        this.documentos.push({ ...doc, base64 });
      });
    } catch (error) {
      console.error("Error al cargar los documentos:", error);
      this.alertService.showAlert(
        "No se encontraron documentos",
        "No se encontraron documentos asociados"
      );
      this.dialogRef.close();
    }
  }

  /**
   * Inferes the tabs to display based on the types of documents loaded.
   */
  inferirPestanasDeDocumentos() {
    const tabsInferidas: TabDocumento[] = [];
    this.documentos.forEach((doc) => {
      const tipoDocumentoEntry = Object.entries(environment.TIPO_DOCUMENTO_PARAMETROS)
                                       .find(([_, id]) => id === doc.tipo_id);
      if (tipoDocumentoEntry) {
        const nombreParametro = tipoDocumentoEntry[0]
                                  .toLowerCase()
                                  .replaceAll("_", " ")
                                  // Capitalize first letter of each word
                                  .replace(/\b\w/g, char => char.toUpperCase());
        const tab: TabDocumento = { nombre: nombreParametro, tipoId: doc.tipo_id }
        if (doc.tipo_id === environment.TIPO_DOCUMENTO_PARAMETROS.ACTA_MODIFICACION_PLAN) {
          tab.fecha_subida = doc.fecha_creacion;
        }
        tabsInferidas.push(tab);
      }
    });

    this.tabs = tabsInferidas;
  }

  async renderizarDocumentos() {
    try {
      const documentosDisponibles = [...this.documentos];

      this.tabs.forEach((tab, index) => {
        let documentoIdx = documentosDisponibles.findIndex((doc) =>
          this.coincideDocumentoConTab(tab, doc)
        );

        if (documentoIdx === -1) {
          documentoIdx = documentosDisponibles.findIndex(
            (doc) => doc.tipo_id === tab.tipoId
          );
        }

        if (documentoIdx === -1) {
          return;
        }

        const documento = documentosDisponibles[documentoIdx];
        this.documentosPorTab[index] = documento.base64;
        this.documentoInfoPorTab[index] = documento;
        if (!this.tabs[index].documentoId) {
          this.tabs[index].documentoId = documento._id;
        }
        documentosDisponibles.splice(documentoIdx, 1);
      });
    } catch (error) {
      console.error("Error al renderizar los documentos:", error);
      this.alertService.showErrorAlert(
        "Ocurrió un error inesperado al renderizar los documentos"
      );
      this.dialogRef.close();
    }
  }

  private coincideDocumentoConTab(tab: TabDocumento, documento: DocumentoModal): boolean {
    if (tab.documentoId) {
      return documento._id === tab.documentoId;
    }

    if (tab.matcherMetadatos) {
      return Object.entries(tab.matcherMetadatos).every(([key, value]) => {
        return documento.metadatos?.[key] === value;
      }) && documento.tipo_id === tab.tipoId;
    }

    return documento.tipo_id === tab.tipoId;
  }

  async ejecutarBotonTab(boton: BotonTabDocumento): Promise<void> {
    await boton.accion(this.getBotonContext());
  }

  async ejecutarAccionFooter(accionFooter: AccionFooterModal): Promise<void> {
    const debeCerrar = await accionFooter.accion();
    if (debeCerrar) {
      this.dialogRef.close(true);
    }
  }

  getBotonContext(): BotonTabDocumentoContext {
    return {
      tab: this.tabs[this.selectedTab],
      selectedTab: this.selectedTab,
      documento: this.documentoInfoPorTab[this.selectedTab],
      refresh: () => this.recargarContenido(),
    };
  }

  abrirCargueAdjuntoTabActual(): void {
    const tabActual = this.tabs[this.selectedTab];
    const config = tabActual?.cargueAdjuntoConfig;
    const documentoActual = this.documentoInfoPorTab[this.selectedTab];

    if (!tabActual || !config) {
      return;
    }

    if (!documentoActual?._id) {
      this.alertService.showErrorAlert("No se encontró el registro del documento a actualizar.");
      return;
    }

    const metadatos = {
      ...(documentoActual.metadatos || {}),
      ...(config.metadatosAdicionales || {}),
    };

    const dialogRef = this.matDialog.open(CargarArchivoComponent, {
      width: "800px",
      data: {
        tipoArchivo: config.tipoArchivo || "pdf",
        id: documentoActual.referencia_id || this.data.entityId,
        idTipoDocumento: config.idTipoDocumento,
        descripcion: config.descripcion,
        cargaLambda: false,
        tipoIdReferencia: documentoActual.tipo_id,
        referencia:
          documentoActual.referencia_tipo ||
          config.referenciaTipoFallback ||
          "Auditoria",
        metadatos,
        documentoIdActualizar: documentoActual._id,
      },
    });

    dialogRef.afterClosed().subscribe(async (guardadoExitoso: boolean) => {
      if (!guardadoExitoso) {
        return;
      }

      await this.recargarContenido();

      if (config.onSuccess) {
        await config.onSuccess(this.getBotonContext());
      }
    });
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }

  async descargarTodo() {
    const suffixNormalizado = this.suffix ? `-${this.suffix.replace(/\s+/g, '-')}` : '';
    try {
      await this.descargaService.descargarMultiplesArchivos(
        this.documentos,
        `documentos${suffixNormalizado}.zip`,
        this.suffix,
      );
    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error);
    }
  }
}
