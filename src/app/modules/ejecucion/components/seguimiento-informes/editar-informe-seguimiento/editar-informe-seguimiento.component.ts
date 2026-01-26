import { Component, OnInit, ViewChild } from '@angular/core';
import { MatStepper } from "@angular/material/stepper";
import { BreakpointObserver } from "@angular/cdk/layout";
import { Router, ActivatedRoute } from "@angular/router";
import { Formulario } from "src/app/shared/data/models/formulario.model";
import { formularioInformacionSeguimiento } from "./editar-informe-seguimiento.utilidades";
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormularioDinamicoComponent } from 'src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component';
import { AlertService } from "src/app/shared/services/alert.service";
import { MatDialog } from "@angular/material/dialog";
import { ModalVerDocumentosComponent } from "src/app/shared/elements/components/dialogs/modal-ver-documentos/modal-ver-documentos.component";

@Component({
  selector: 'app-editar-informe-seguimiento',
  templateUrl: './editar-informe-seguimiento.component.html',
  styleUrls: ['./editar-informe-seguimiento.component.css']
})
export class EditarInformeSeguimientoComponent implements OnInit {
  @ViewChild("stepper") stepper!: MatStepper;

  @ViewChild("formularioInformacionComp")
  formularioInformacionComponent!: FormularioDinamicoComponent;
  formularioInformacion: Formulario | undefined;

  formAspectosGenerales: FormGroup;
  formObservaciones: FormGroup;

  seguimientoId!: string;
  esLineal = false;
  orientation: "horizontal" | "vertical" = "horizontal";

  constructor(
    private alertaService: AlertService,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.formAspectosGenerales = this.fb.group({
      contenido: [''],
    });
    this.formObservaciones = this.fb.group({
      observaciones: [''],
      notas: [''],
    });
  }

  ngOnInit() {
    this.cargarFormularios();
    this.manejarResponsiveStepper();
    this.seguimientoId = this.route.snapshot.paramMap.get("id")!;
  }

  cargarFormularios(): void {
    this.formularioInformacion = formularioInformacionSeguimiento;
  }

  enviarFormInformacion() {
    this.formularioInformacionComponent.onSubmit();
  }

  preguntarGuardadoInformacion(dataForm: any) {
    if (!dataForm) {
      return this.alertaService.showAlert(
        "Formulario incompleto",
        "Debe llenar todos los campos obligatorios"
      );
    }

    this.alertaService
      .showConfirmAlert("¿Está seguro(a) de guardar la información?")
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }
        this.guardarInformacion(dataForm);
      });
  }

  guardarInformacion(informacion: any) {
    const seguimientoId = this.seguimientoId;
    const informacionEditar = this.mapearInfoFormInformacion(informacion);
    console.log(informacionEditar);
    this.stepper.next();
  }

  mapearInfoFormInformacion(informacion: any) {
    return {
      alcance: informacion.alcance_auditoria,
      criterio: informacion.criterios,
      fecha_emision_informe: informacion.fecha_emision_informe,
      lider_id: informacion.lider,
      no_auditoria: informacion.no_auditoria,
      objetivo: informacion.objetivo_auditoria,
      macroproceso: informacion.proceso,
      responsable_id: informacion.responsable,
      tipo_id: informacion.tipo,
      muestra: informacion.muestra,
    };
  }

  manejarResponsiveStepper() {
    this.breakpointObserver
      .observe(["(max-width: 992px)"])
      .subscribe((result) => {
        this.orientation = result.matches ? "vertical" : "horizontal";
      });
  }

  regresarRuta() {
    this.router.navigate([`/ejecucion/seguimiento-informes`]);
  }

  onSubmitAspectosGenerales() {
    console.log(this.formAspectosGenerales.value);
    this.stepper.next();
  }

  onSubmitObservaciones() {
    console.log(this.formObservaciones.value);
  }

  verInforme() {
    this.dialog.open(ModalVerDocumentosComponent, {
      width: "1200px",
      data: {
        entityId: this.seguimientoId,
        titulo: "Ver Documentos",
        descripcion: "Documentos del Seguimiento",
        tabs: [
          { nombre: "Informe Final", tipoId: 0 }, // TODO: Agregar tipoId correcto en environment
          { nombre: "Oficio Anuncio Solicitud Información", tipoId: 0 }, // TODO: Agregar tipoId correcto en environment
        ],
        textoBotonCerrar: "Guardar y Cerrar"
      },
    });
  }

  guardarYCerrar() {
    this.alertaService
      .showConfirmAlert("¿Está seguro (a) de guardar el informe final?")
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }
        this.onSubmitObservaciones();
        this.alertaService.showSuccessAlert(
          "El informe fue guardado exitosamente",
          "INFORME FINAL GUARDADO"
        );
        this.regresarRuta();
      });
  }
}
