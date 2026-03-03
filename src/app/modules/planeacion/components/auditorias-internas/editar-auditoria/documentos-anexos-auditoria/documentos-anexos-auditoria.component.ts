import { Component, EventEmitter, OnInit, Output } from "@angular/core";
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
import { ModalVisualizarRecargarCompromisoEticoComponent } from "./modal-visualizar-recargar-compromiso-etico/modal-visualizar-recargar-compromiso-etico.component";

@Component({
  selector: "app-documentos-anexos-auditoria",
  templateUrl: "./documentos-anexos-auditoria.component.html",
  styleUrls: ["./documentos-anexos-auditoria.component.css"],
})
export class DocumentosAnexosAuditoriaComponent implements OnInit {
  @Output() guardarDocumentos = new EventEmitter<any>();

  auditoriaId: string = "";
  formularioDocumentos: FormGroup;
  idCompromisoEtico: any = null;
  base64CompromisoEtico: any = null;

  documentos = [
    {
      nombre: "Programa de Auditoria",
      plantilla: "programa-auditoria",
      parametro: environment.TIPO_DOCUMENTO_PARAMETROS.PROGRAMA_TRABAJO,
    },
    {
      nombre: "Oficio Anuncio Solicitud de Información",
      plantilla: "solicitud-informacion",
      parametro: environment.TIPO_DOCUMENTO_PARAMETROS.SOLICITUD_INFORMACION,
    },
    {
      nombre: "Carta de Representación",
      plantilla: "carta-presentacion",
      parametro: environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION,
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
    try {
      this.idCompromisoEtico = await this.buscarCompromisoEtico();
      if (this.idCompromisoEtico !== null) {
        this.buscarBase64(this.idCompromisoEtico);
      }
    } catch (error) {
      console.error("Error al obtener el compromiso ético", error);
    }
  }

  subirCompromisoEtico(): void {
    const dialogRef = this.dialog.open(CargarArchivoComponent, {
      width: "800px",
      data: {
        tipoArchivo: "pdf",
        id: this.auditoriaId,
        idTipoDocumento: environment.TIPO_DOCUMENTO.PROGRAMA_TRABAJO_AUDITORIA,
        descripcion: "Compromiso ético de auditoría interna",
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
            if (res && Array.isArray(res.Data) && res.Data.length > 0) {
              resolve(res.Data[0].nuxeo_enlace);
            } else {
              resolve(null);
            }
          },
          (error) => {
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
        data: { base64Document: this.base64CompromisoEtico, id: this.auditoriaId },
        width: "80%",
        height: "80vh",
      });
    }

  onGuardar() {
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

    const modalInstance = dialogRef.componentInstance;
    modalInstance.botonGuardar = { icono: "save", texto: "Guardar documento" };

    dialogRef.afterClosed().subscribe((res) => {
      if (!res) return;

      if (res.accion === "guardarDocumento") {
        this.guardarDocumento(documentoBase64, infoDocumento);
      }
    });
  }

  guardarDocumento(documentoBase64: any, infoDocumento: any) {
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
