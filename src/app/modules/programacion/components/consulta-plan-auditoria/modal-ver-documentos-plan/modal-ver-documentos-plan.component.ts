import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { lastValueFrom } from 'rxjs';
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";

@Component({
  selector: 'app-modal-ver-documentos-plan',
  templateUrl: './modal-ver-documentos-plan.component.html',
  styleUrl: './modal-ver-documentos-plan.component.css'
})
export class ModalVerDocumentosPlanComponent implements OnInit{
  selectedTab: number = 0;
  documento: string = "";
  documentoMatrizPublica: string = "";

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { planAuditoriaId: string; },
    public dialogRef: MatDialogRef<ModalVerDocumentosPlanComponent>,
    private referenciaPdfService: ReferenciaPdfService,
    private nuxeoService: NuxeoService,
  ){}

  async ngOnInit() {
     try{
      this.documento = await this.renderDocumento(0);
      this.documentoMatrizPublica= await this.renderDocumento(0);
    }catch(error){
      console.log("no se genero el base 64");
    }
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }

  async renderDocumento(tipoId: number): Promise<string> {
    try {
      const enlace = await lastValueFrom(
        this.referenciaPdfService.consultarDocumento(this.data.planAuditoriaId, tipoId)
      );
      const base64 = await this.nuxeoService.getByUUID(enlace);
      return base64;
    } catch (error) {
      console.error(`Error al renderizar el documento para tipoId ${tipoId}:`, error);
      return ""; 
    }
  }
}
