import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { CargarArchivoComponent } from "src/app/shared/elements/components/cargar-archivo/cargar-archivo.component";
import { ModalVerDocumentoComponent } from "src/app/shared/elements/components/dialogs/modal-ver-documento/modal-ver-documento.component";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";
import { ModalVisualizarRecargarCompromisoEticoComponent } from "../../../auditorias-internas/editar-auditoria/documentos-anexos-auditoria/modal-visualizar-recargar-compromiso-etico/modal-visualizar-recargar-compromiso-etico.component";

@Component({
    selector: "app-documentos-anexos-seguimiento",
    templateUrl: "./documentos-anexos-seguimiento.component.html",
    styleUrls: ["./documentos-anexos-seguimiento.component.css"],
    standalone: false
})
export class DocumentosAnexosSeguimientoComponent implements OnInit {
  @Output() guardarDocumentos = new EventEmitter<any>();
  @Input() soloLectura: boolean = false;

  auditoriaId: string = "";
  formularioDocumentos: FormGroup;
  idCompromisoEtico: any = null;
  base64CompromisoEtico: any = null;
  documentosExistentes: { [tipoId: number]: string | null } = {};

  documentos = [
    {
      nombre: "Oficio Anuncio Solicitud de Información",
      plantilla: "solicitud-informacion",
      parametro: environment.TIPO_DOCUMENTO_PARAMETROS.SOLICITUD_INFORMACION,
    },
    {
      nombre: "Compromiso Ético",
      parametro: environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO,
    }
  ];

  constructor(
    private readonly dialog: MatDialog,
    private readonly alertService: AlertService,
    private readonly fb: FormBuilder,
    private readonly nuxeoService: NuxeoService,
    private readonly route: ActivatedRoute,
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly PlanAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService
  ) {
    this.formularioDocumentos = this.fb.group({
      campoDocumentos: ["", Validators.required],
    });
  }

  async ngOnInit() {
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
    await this.cargarEstadoDocumentos();
    try {
      this.idCompromisoEtico = await this.buscarCompromisoEtico();
      if (this.idCompromisoEtico !== null) {
        this.buscarBase64(this.idCompromisoEtico);
      }
    } catch (error) {
      console.error("Error al obtener el compromiso ético", error);
    }
  }

  private async cargarEstadoDocumentos(): Promise<void> {
    const documentosConPlantilla = this.documentos.filter((documento) => !!documento.plantilla);

    await Promise.all(
      documentosConPlantilla.map(async (documento) => {
        this.documentosExistentes[documento.parametro] = await this.buscarDocumentoPorTipo(documento.parametro);
      })
    );
  }

  private buscarDocumentoPorTipo(tipoDocumento: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.planAnualAuditoriaService
        .get(
          `documento?query=referencia_id:${this.auditoriaId},referencia_tipo:Auditoria,tipo_id:${tipoDocumento},activo:true&fields=nuxeo_enlace`
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
            console.error("Error al buscar documento adjunto", error);
            reject(error);
          }
        );
    });
  }

  existeDocumento(documento: any): boolean {
    return !!this.documentosExistentes[documento.parametro];
  }

  manejarDocumento(documento: any): void {
    if (this.existeDocumento(documento)) {
      this.verDocumentoGuardado(documento);
      return;
    }

    this.generarDocumento(documento);
  }

  private async verDocumentoGuardado(documento: any): Promise<void> {
    const nuxeoId = this.documentosExistentes[documento.parametro];
    if (!nuxeoId) {
      this.generarDocumento(documento);
      return;
    }

    try {
      const documentoBase64 = await this.nuxeoService.obtenerPorUUID(nuxeoId);
      this.verDocumento(documentoBase64, documento);
    } catch (error) {
      console.error("Error al cargar documento guardado", error);
      this.alertService.showErrorAlert("No fue posible visualizar el documento guardado.");
    }
  }

  subirCompromisoEtico(): void {
      if (this.soloLectura) {
        return;
      }

      this.dialog.open(CargarArchivoComponent, {
        width: "800px",
        data: {
          tipoArchivo: "pdf",
          id: this.auditoriaId,
          idTipoDocumento: environment.TIPO_DOCUMENTO.PROGRAMA_TRABAJO_AUDITORIA,
          descripcion: "Compromiso ético de auditoría de seguimiento",
          cargaLambda: false,
          tipoIdReferencia: environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO,
          referencia: "Auditoria",
        }
      });
    }
  
    buscarCompromisoEtico(): Promise<string | null> {
      return new Promise((resolve, reject) => {
        this.planAnualAuditoriaService.get(`documento?query=referencia_id:${this.auditoriaId},referencia_tipo:Auditoria,tipo_id:${environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO},activo:true&fields=nuxeo_enlace`)
          .subscribe(
            (res) => {
              if (res?.Data?.length > 0) {
                resolve(res.Data[0].nuxeo_enlace);
              } else {
                resolve(null);
              }
            },
            (error: Error) => {
              console.log("Error al buscar el compromiso Ético");
              this.alertService.showErrorAlert("Error al buscar Compromiso Ético");
              reject(error);
            }
          );
      });
    }
  
    async buscarBase64(nuxeoId: string) {
      this.base64CompromisoEtico = await this.nuxeoService.obtenerPorUUID(nuxeoId);
    }
  
    verCompromisoEtico() {
        this.dialog.open(ModalVisualizarRecargarCompromisoEticoComponent, {
          data: { base64Document: this.base64CompromisoEtico, id: this.auditoriaId, soloLectura: this.soloLectura },
          width: "80%",
          height: "80vh",
        });
      }

  onGuardar() {
    if (this.soloLectura) {
      return;
    }

    if (this.formularioDocumentos.valid) {
      this.guardarDocumentos.emit(this.documentos);
    }
  }

  generarDocumento(documento: any) {
    const plantilla = documento.plantilla;
    const idAuditoria = this.auditoriaId;
    this.PlanAnualAuditoriaMid.get(
      `plantilla/${plantilla}/${idAuditoria}`
    ).subscribe((res) => {
      this.verDocumento(res.Data, documento);
    });
  }

  verDocumento(documentoBase64: any, infoDocumento: any) {
    const dialogRef = this.dialog.open(ModalVerDocumentoComponent, {
      width: "1000px",
      data: documentoBase64,
      autoFocus: false,
    });

    if (!this.soloLectura) {
      const modalInstance = dialogRef.componentInstance;
      modalInstance.botonGuardar = { icono: "save", texto: "Guardar documento" };
    }

    dialogRef.afterClosed().subscribe((res) => {
      if (!res) return;

      if (!this.soloLectura && res.accion === "guardarDocumento") {
        this.guardarDocumento(documentoBase64, infoDocumento);
      }
    });
  }

  guardarDocumento(documentoBase64: any, infoDocumento: any) {
    if (this.soloLectura) {
      return;
    }

    if (documentoBase64 !== "") {
      const payload = {
        IdTipoDocumento: environment.TIPO_DOCUMENTO.PROGRAMA_TRABAJO_AUDITORIA,
        nombre: infoDocumento.nombre,
        descripcion:
          "Documento pdf (" +
          infoDocumento.plantilla +
          ") de auditoría de plan de auditoría",
        metadatos: {},
        file: documentoBase64,
      };

      this.nuxeoService.guardarArchivos([payload]).subscribe({
        next: (response: any) => {
          const documentoRefNuxeo = response[0];
          this.guardarReferencia(
            documentoRefNuxeo,
            "Auditoria",
            this.auditoriaId,
            infoDocumento.parametro
          );
          this.documentosExistentes[infoDocumento.parametro] = documentoRefNuxeo?.res?.Enlace ?? null;
        },
        error: (error) => {
          console.error("Error al subir el documento", error);
        },
      });
    }
  }

  guardarReferencia(
    nuxeoResponse: any,
    referencia_tipo: string,
    referencia_id: string,
    tipo_id: number
  ): void {
    if (nuxeoResponse.res.Enlace) {
      this.referenciaPdfService
        .guardarReferencia(
          nuxeoResponse.res,
          referencia_tipo,
          referencia_id,
          tipo_id
        )
        .subscribe({
          next: (response) => {
            this.alertService.showSuccessAlert("Archivo subido exitosamente.");
          },
          error: (error) => {
            console.error("Error al guardar la referencia", error);
          },
        });
    }
  }
}
