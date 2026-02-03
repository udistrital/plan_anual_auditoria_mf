import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { ModalVerDocumentoComponent } from "src/app/shared/elements/components/dialogs/modal-ver-documento/modal-ver-documento.component";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-documentos-anexos-seguimiento",
  templateUrl: "./documentos-anexos-seguimiento.component.html",
  styleUrls: ["./documentos-anexos-seguimiento.component.css"],
})
export class DocumentosAnexosSeguimientoComponent implements OnInit {
  @Output() guardarDocumentos = new EventEmitter<any>();

  auditoriaId: string = "";
  formularioDocumentos: FormGroup;

  documentos = [
    {
      nombre: "Oficio Anuncio Solicitud de Información",
      plantilla: "solicitud-informacion",
      parametro: environment.TIPO_DOCUMENTO_PARAMETROS.SOLICITUD_INFORMACION,
    },
  ];

  constructor(
    private readonly dialog: MatDialog,
    private readonly alertService: AlertService,
    private readonly fb: FormBuilder,
    private readonly nuxeoService: NuxeoService,
    private readonly route: ActivatedRoute,
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly PlanAnualAuditoriaMid: PlanAnualAuditoriaMid
  ) {
    this.formularioDocumentos = this.fb.group({
      campoDocumentos: ["", Validators.required],
    });
  }

  ngOnInit() {
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
  }

  onArchivoSeleccionado(event: any, index: number): void {}

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
