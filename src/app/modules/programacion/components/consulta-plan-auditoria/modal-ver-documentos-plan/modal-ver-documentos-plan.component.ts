import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { lastValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GestorDocumentalService } from "src/app/core/services/gestor-documental.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";

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
    private planAuditoriaService: PlanAnualAuditoriaService,
    private gestorDocumentalService: GestorDocumentalService,
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

  async consultarNuxeo(id: string): Promise<string> {
    try {
      const response = await lastValueFrom(
        this.gestorDocumentalService.get(`document/${id}`).pipe(
          map((response: any) => {

            // Validar si el campo `file` está presente en la respuesta
            if (response && response.file) {
              return response.file; // Retorna el campo `file`
            } else {
              throw new Error('El campo "file" no se encontró en la respuesta.');
            }
          }),
          catchError((error) => {
            throw new Error('No se pudo obtener el file.');
          })
        )
      );

      return response; // Devuelve el campo `file`
    } catch (error) {
      console.error('Error en consultarNuxeo:', error);
      throw error; // Permitir el manejo del error en la llamada al método
    }
  }

  async consultarDocumento(tipoId: number): Promise<string> {
    try {
      const nuxeoId = await lastValueFrom(
        this.planAuditoriaService.get(`documento?query=referencia_id:${this.data.planAuditoriaId},tipo_id:${tipoId}&fields=nuxeo_enlace`).pipe(
          map((response: any) => {
            if (response && response.Data && Array.isArray(response.Data) && response.Data.length > 0) {
              const firstItem = response.Data[0];
              if (firstItem.nuxeo_enlace) {
                return firstItem.nuxeo_enlace;
              }
            }
            throw new Error('El campo "nuxeo_enlace" no se encontró en la respuesta.');
          }),
          catchError((error) => {
            console.error('Error al consultar el documento:', error);
            throw new Error('No se pudo obtener el nuxeo_enlace.');
          })
        )
      );
      return nuxeoId;
    } catch (error) {
      console.error('Error en consultarDocumento:', error);
      throw error; // Permitir manejo del error en el lugar donde se llama este método
    }
  }
  async renderDocumento(tipoId: number): Promise<string> {
    const enlace = await this.consultarDocumento(tipoId);
    const base64 = await this.consultarNuxeo(enlace);
    return base64;
  }
}
