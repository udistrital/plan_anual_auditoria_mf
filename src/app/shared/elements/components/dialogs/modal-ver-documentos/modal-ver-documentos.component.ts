import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { lastValueFrom } from "rxjs";
import { environment } from "src/environments/environment";

//servicios
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { AlertService } from "src/app/shared/services/alert.service";

export interface TabDocumento {
  nombre: string;
  tipoId: number;
}

export interface ModalVerDocumentosData {
  entityId: string;
  titulo?: string;
  descripcion?: string;
  tabs?: TabDocumento[];
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
  tabs: TabDocumento[] = [
    { nombre: "Formato PAA", tipoId: environment.TIPO_DOCUMENTO_PARAMETROS.PLAN_ANUAL_AUDITORIA },
    { nombre: "Matriz Función Pública", tipoId: environment.TIPO_DOCUMENTO_PARAMETROS.MATRIZ_FUNCION_PUBLICA },
  ];

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
      await this.renderizarDocumentos();
    } catch (error) {
      console.error("Error al inicializar los documentos:", error);
    }
  }

  async renderizarDocumentos() {
    try {
      const enlacesConTipo = await lastValueFrom(
        this.referenciaPdfService.consultarDocumentos(this.data.entityId)
      );

      const enlaces = enlacesConTipo.map((doc) => doc.nuxeo_enlace);
      const base64Files = await this.nuxeoService.obtenerPorUUIDs(enlaces);

      enlacesConTipo.forEach((doc, index) => {
        const base64 = base64Files[index];
        this.documentos.push({ base64, tipo_id: doc.tipo_id });

        // Asignar documento al tab correspondiente
        const tabIndex = this.tabs.findIndex(tab => tab.tipoId === doc.tipo_id);
        if (tabIndex !== -1 && !this.documentosPorTab[tabIndex]) {
          this.documentosPorTab[tabIndex] = base64;
        }
      });
    } catch (error) {
      console.error("Error al renderizar los documentos:", error);
      this.alertService.showAlert(
        "No se encontraron documentos",
        "No se encontraron documentos asociados"
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
