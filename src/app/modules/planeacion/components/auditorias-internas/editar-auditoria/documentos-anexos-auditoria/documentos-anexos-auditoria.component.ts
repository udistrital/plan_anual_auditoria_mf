import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { ModalVerDocumentoComponent } from "src/app/shared/elements/components/dialogs/modal-ver-documento/modal-ver-documento.component";

@Component({
  selector: "app-documentos-anexos-auditoria",
  templateUrl: "./documentos-anexos-auditoria.component.html",
  styleUrls: ["./documentos-anexos-auditoria.component.css"],
})
export class DocumentosAnexosAuditoriaComponent implements OnInit {
  @Output() guardarDocumentos = new EventEmitter<any>();

  auditoriaId: string = "";
  formularioDocumentos: FormGroup;

  documentos = [
    {
      nombre: "Oficio Anuncio Solicitud de Información",
      plantilla: "solicitud-informacion",
    },
    { nombre: "Carta de Representación", plantilla: "carta-presentacion" },
    { nombre: "Compromiso Ético", archivo: null },
  ];

  constructor(
    private readonly dialog: MatDialog,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly PlanAnualAuditoriaMid: PlanAnualAuditoriaMid
  ) {
    this.formularioDocumentos = this.fb.group({
      campoDocumentos: ["", Validators.required],
    });
  }

  ngOnInit() {
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
    console.log(this.auditoriaId);
  }

  onArchivoSeleccionado(event: any, index: number): void {
    const file = event.target.files[0];
    this.documentos[index].archivo = file;
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
      documento.archivo = res.Data;
      this.verDocumento(res.Data);
    });
  }

  verDocumento(documentoBase64: any) {
    this.dialog.open(ModalVerDocumentoComponent, {
      width: "1000px",
      data: documentoBase64,
      autoFocus: false,
    });
  }
}
