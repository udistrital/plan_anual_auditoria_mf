import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CargarArchivoComponent } from 'src/app/shared/elements/components/cargar-archivo/cargar-archivo.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-modal-visualizar-recargar-informe-auditoria',
  templateUrl: './modal-visualizar-recargar-informe-auditoria.component.html',
  styleUrl: './modal-visualizar-recargar-informe-auditoria.component.css'
})
export class ModalVisualizarRecargarInformeAuditoriaComponent implements OnInit {
  protected base64: string = '';
  protected idAuditoria: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { base64Document: string; id: string },
    private readonly dialog: MatDialog,
  ) { }

  ngOnInit() {
    if (this.data.base64Document) {
      this.base64 = this.data.base64Document;
      this.idAuditoria = this.data.id;
    } else {
      console.error('No se proporcionó un documento PDF');
    }
  }

  actualizarDocumento() {
    this.dialog.open(CargarArchivoComponent, {
      width: '800px',
      data: {
        tipoArchivo: 'pdf',
        id: this.idAuditoria,
        idTipoDocumento: environment.TIPO_DOCUMENTO.PROGRAMA_TRABAJO_AUDITORIA,
        descripcion: 'Informe de auditoría externa',
        cargaLambda: false,
        tipoIdReferencia: environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO,
        referencia: 'Auditoria',
      },
    });
  }
}
