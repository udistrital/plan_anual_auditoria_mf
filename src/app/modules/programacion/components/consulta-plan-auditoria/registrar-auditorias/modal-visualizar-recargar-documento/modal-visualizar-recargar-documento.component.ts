import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatDialog } from "@angular/material/dialog";
import { CargarArchivoComponent } from "src/app/shared/elements/components/cargar-archivo/cargar-archivo.component";
import { environment } from "src/environments/environment";

@Component({
  selector: 'app-modal-visualizar-recargar-documento',
  templateUrl: './modal-visualizar-recargar-documento.component.html',
  styleUrl: './modal-visualizar-recargar-documento.component.css'
})

export class ModalVisualizarRecargarDocumentoComponent {
  protected base64: string= "";
  protected idPlan: string="";
 constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { base64Document: string; id: string,
     },
     private dialog: MatDialog,

  ) { }
  ngOnInit() {
    const documentSource = this.data.base64Document;
    if (documentSource) {
      this.base64=documentSource;
      this.idPlan=this.data.id
    } else {
      console.error("No se proporcionó un documento PDF");
    }
  }
  actualizarDocuemnto(){
    const dialogRef = this.dialog.open(CargarArchivoComponent, {
      width: "800px",
      data: {
        tipoArchivo: 'pdf',
        id: this.idPlan,
        idTipoDocumento: environment.TIPO_DOCUMENTO.MATRIZ_FUNCION_PUBLICA,
        descripcion: 'Matriz función pública',
        cargaLambda: false,
        tipoIdReferencia: environment.TIPO_DOCUMENTO_PARAMETROS.MATRIZ_FUNCION_PUBLICA
      },
    });
  }
}
