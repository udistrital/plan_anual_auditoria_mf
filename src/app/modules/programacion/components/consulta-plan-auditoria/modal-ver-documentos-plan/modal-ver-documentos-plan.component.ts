import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { lastValueFrom } from 'rxjs';
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { environment } from "src/environments/environment";
import * as JSZip from 'jszip'; 
import { saveAs } from 'file-saver'; 

@Component({
  selector: 'app-modal-ver-documentos-plan',
  templateUrl: './modal-ver-documentos-plan.component.html',
  styleUrl: './modal-ver-documentos-plan.component.css'
})
export class ModalVerDocumentosPlanComponent implements OnInit{
  selectedTab: number = 0;
  documentos: { base64: string; tipo_id: number }[] = [];
  documentoPAA: string = "";
  documentoMatrizPublica: string = "";

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { planAuditoriaId: string; },
    public dialogRef: MatDialogRef<ModalVerDocumentosPlanComponent>,
    private referenciaPdfService: ReferenciaPdfService,
    private nuxeoService: NuxeoService,
  ){}

  async ngOnInit() {
    try {
      await this.renderizarDocumentos();
    } catch (error) {
      console.error("Error al inicializar los documentos:", error);
    }
  }

  async renderizarDocumentos() {
    try {
      const tipoIdPAA = environment.TIPO_DOCUMENTO_PARAMETROS.PLAN_ANUAL_AUDITORIA; 
      const tipoIdMatrizPublica = environment.TIPO_DOCUMENTO_PARAMETROS.MATRIZ_FUNCION_PUBLICA;

      const enlacesConTipo = await lastValueFrom(
        this.referenciaPdfService.consultarDocumentos(this.data.planAuditoriaId)
      );

      const enlaces = enlacesConTipo.map((doc) => doc.nuxeo_enlace);
      const base64Files = await this.nuxeoService.obtenerPorUUIDs(enlaces);

      enlacesConTipo.forEach((doc, index) => {
        const base64 = base64Files[index];
        this.documentos.push({ base64, tipo_id: doc.tipo_id });

        if (doc.tipo_id === tipoIdPAA && !this.documentoPAA) {
          this.documentoPAA = base64;
        }
        if (doc.tipo_id === tipoIdMatrizPublica && !this.documentoMatrizPublica) {
          this.documentoMatrizPublica = base64;
        }
      });

    } catch (error) {
      console.error("Error al renderizar los documentos:", error);
    }
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }


  async descargarTodo() {
    const zip = new JSZip();
    const tipoIdPAA = environment.TIPO_DOCUMENTO_PARAMETROS.PLAN_ANUAL_AUDITORIA; 
    const tipoIdMatrizPublica = environment.TIPO_DOCUMENTO_PARAMETROS.MATRIZ_FUNCION_PUBLICA;

    try {
      this.documentos.forEach((doc, index) => {
        let fileName = `documento_${index + 1}.pdf`;

        // Nombres específicos según tipo_id
        if (doc.tipo_id === tipoIdPAA) {
          fileName = `plan_anual_auditoria.pdf`;
        } else if (doc.tipo_id === tipoIdMatrizPublica) {
          fileName = `matriz_funcion_publica.pdf`;
        }

        zip.file(fileName, doc.base64, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "documentosPAA.zip");
    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error);
    }
  }
  
}
