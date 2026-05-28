import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CargarArchivoComponent } from 'src/app/shared/elements/components/cargar-archivo/cargar-archivo.component';
import { NuxeoService } from 'src/app/core/services/nuxeo.service';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-modal-visualizar-recargar-compromiso-etico',
    templateUrl: './modal-visualizar-recargar-compromiso-etico.component.html',
    styleUrl: './modal-visualizar-recargar-compromiso-etico.component.css',
    standalone: false
})
export class ModalVisualizarRecargarCompromisoEticoComponent {
  protected base64: string = "";
  protected idAuditoria: string = "";
  protected soloLectura: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { base64Document: string; id: string; soloLectura?: boolean; onUpdated?: (newBase64: string) => void },
    private readonly dialog: MatDialog,
    private readonly dialogRef: MatDialogRef<ModalVisualizarRecargarCompromisoEticoComponent>,
    private readonly nuxeoService: NuxeoService,
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService,
  ) { }

  ngOnInit() {
    const documentSource = this.data.base64Document;

    if (documentSource) {
      this.base64 = documentSource;
      this.idAuditoria = this.data.id;
      this.soloLectura = this.data.soloLectura ?? false;
    } else {
      console.error("No se proporcionó un documento PDF");
    }
  }

  actualizarDocumento() {
    if (this.soloLectura) {
      return;
    }

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

    dialogRef.afterClosed().subscribe(async (guardadoExitoso: boolean) => {
      if (guardadoExitoso) {
        await this.refrescarCompromisoEtico();
        if (typeof this.data.onUpdated === 'function') {
          this.data.onUpdated(this.base64);
        }
      }
    });
  }

  private async refrescarCompromisoEtico(): Promise<void> {
    try {
      const nuxeoId = await this.buscarCompromisoEtico();
      if (nuxeoId) {
        this.base64 = await this.nuxeoService.obtenerPorUUID(nuxeoId);
      }
    } catch (error) {
      console.error('Error al refrescar el compromiso ético', error);
    }
  }

  private buscarCompromisoEtico(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.planAnualAuditoriaService
        .get(
          `documento?query=referencia_id:${this.idAuditoria},referencia_tipo:Auditoria,tipo_id:${environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO},activo:true&fields=nuxeo_enlace`
        )
        .subscribe(
          (res) => {
            if (res?.Data?.length > 0) {
              resolve(res.Data[0].nuxeo_enlace);
            } else {
              resolve(null);
            }
          },
          (error: Error) => {
            console.error('Error al buscar el compromiso Ético', error);
            reject(error);
          }
        );
    });
  }
}
