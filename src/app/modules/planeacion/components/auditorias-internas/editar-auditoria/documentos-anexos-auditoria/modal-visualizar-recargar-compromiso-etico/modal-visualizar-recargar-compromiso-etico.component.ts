import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CargarArchivoComponent } from 'src/app/shared/elements/components/cargar-archivo/cargar-archivo.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-modal-visualizar-recargar-compromiso-etico',
  templateUrl: './modal-visualizar-recargar-compromiso-etico.component.html',
  styleUrl: './modal-visualizar-recargar-compromiso-etico.component.css'
})
export class ModalVisualizarRecargarCompromisoEticoComponent {
  protected base64: string = "";
  protected idAuditoria: string = "";

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { base64Document: string; id: string },
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ModalVisualizarRecargarCompromisoEticoComponent>,
  ) { }

  ngOnInit() {
    const documentSource = this.data.base64Document;

    if (documentSource) {
      this.base64 = documentSource;
      this.idAuditoria = this.data.id;
    } else {
      console.error("No se proporcionó un documento PDF");
    }
  }

  actualizarDocumento() {
    const dialogRef = this.dialog.open(CargarArchivoComponent, {
      width: "800px",
      data: {
        tipoArchivo: 'pdf',
        id: this.idAuditoria,
        idTipoDocumento: environment.TIPO_DOCUMENTO.PROGRAMA_TRABAJO_AUDITORIA,
        descripcion: 'Compromiso ético de auditoría interna',
        cargaLambda: false,
        tipoIdReferencia: environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO,
        referencia: "Auditoria",
      },
    });

    // Cuando CargarArchivoComponent cierra con true (guardado exitoso),
    // se propaga el resultado hacia DocumentosAnexosAuditoriaComponent
    // para que refresque el paso 4.
    dialogRef.afterClosed().subscribe((guardadoExitoso: boolean) => {
      if (guardadoExitoso) {
        this.dialogRef.close(true);
      }
    });
  }
}