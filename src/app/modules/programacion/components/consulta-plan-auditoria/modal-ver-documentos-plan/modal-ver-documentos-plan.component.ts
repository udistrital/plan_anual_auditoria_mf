import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { lastValueFrom } from 'rxjs';
import { environment } from "src/environments/environment";

//servicios
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { DescargaService } from "src/app/shared/services/descarga.service";

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
    private descargaService: DescargaService,
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
    try {
      await this.descargaService.descargarMultiplesArchivos( this.documentos, 'documentosPAA.zip');
    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error);
    }
  }
  
}
