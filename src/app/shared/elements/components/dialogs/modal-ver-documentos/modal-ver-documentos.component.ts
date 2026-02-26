import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { lastValueFrom } from "rxjs";
import { environment } from "src/environments/environment";

//servicios
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { AlertService } from "src/app/shared/services/alert.service";

export interface BotonTabDocumento {
  nombre: string;
  accion: () => void;
  color?: string;
  icono?: string;
}

export interface TabDocumento {
  nombre: string;
  tipoId: number;
  botones?: BotonTabDocumento[];
}

export interface ModalVerDocumentosData {
  entityId: string;
  titulo?: string;
  descripcion?: string;
  tabs?: TabDocumento[];
  inferTabs?: boolean;
  textoBotonCerrar?: string;
}

@Component({
  selector: "app-modal-ver-documentos",
  templateUrl: "./modal-ver-documentos.component.html",
  styleUrl: "./modal-ver-documentos.component.css",
})
export class ModalVerDocumentosComponent implements OnInit {
  selectedTab: number = 0;
  documentos: { base64: string; tipo_id: number }[] = [];
  documentosPorTab: { [key: number]: string } = {};

  titulo: string = "Ver documentos";
  descripcion: string = "Documentos del Plan Anual de Auditoria";
  textoBotonCerrar: string = "Regresar";
  tabs: TabDocumento[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ModalVerDocumentosData,
    public dialogRef: MatDialogRef<ModalVerDocumentosComponent>,
    private readonly alertService: AlertService,
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly nuxeoService: NuxeoService,
    private readonly descargaService: DescargaService
  ) {
    if (data.titulo) this.titulo = data.titulo;
    if (data.descripcion) this.descripcion = data.descripcion;
    if (data.tabs) this.tabs = data.tabs;
    if (data.textoBotonCerrar) this.textoBotonCerrar = data.textoBotonCerrar;
  }

  async ngOnInit() {
    try {
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
      const enlacesConTipo = await lastValueFrom(
        this.referenciaPdfService.consultarDocumentos(this.data.entityId)
      );

      const enlaces = enlacesConTipo.map((doc) => doc.nuxeo_enlace);
      const base64Files = await this.nuxeoService.obtenerPorUUIDs(enlaces);

      enlacesConTipo.forEach((doc, index) => {
        const base64 = base64Files[index];
        this.documentos.push({ base64, tipo_id: doc.tipo_id });
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
        tabsInferidas.push({ nombre: nombreParametro, tipoId: doc.tipo_id });
      }
    });

    this.tabs = tabsInferidas;
  }

  async renderizarDocumentos() {
    try {
      // ! This method assumes that a document will be well matched to any tab of the same tipo_id, no matter the name.
      // Map tabs into availability holders
      const tabHolders = this.tabs.map((tab, i) => ({ idx: i, tab: tab }))
      this.documentos.forEach((doc) => {
        // Assign document to the first available tab that matches its tipo_id
        const holderIdx = tabHolders.findIndex(holder => holder.tab.tipoId === doc.tipo_id);
        if (holderIdx !== -1 && !this.documentosPorTab[tabHolders[holderIdx].idx])
          this.documentosPorTab[tabHolders[holderIdx].idx] = doc.base64;

        // Remove the used holder to prevent multiple assignments
        tabHolders.splice(holderIdx, 1);
      });
    } catch (error) {
      console.error("Error al renderizar los documentos:", error);
      this.alertService.showErrorAlert(
        "Ocurrió un error inesperado al renderizar los documentos"
      );
      this.dialogRef.close();
    }
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }

  async descargarTodo() {
    try {
      await this.descargaService.descargarMultiplesArchivos(
        this.documentos,
        "documentos.zip"
      );
    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error);
    }
  }
}
