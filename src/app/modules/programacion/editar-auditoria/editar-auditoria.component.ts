import { Component, inject, OnInit, ViewChild } from "@angular/core";
import { MatStepper, StepperOrientation } from "@angular/material/stepper";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActividadesAuditoriaComponent } from "./actividades-auditoria/actividades-auditoria.component";
import { Formulario } from "src/app/data/models/formulario.model";
import { FormularioDinamicoComponent } from "src/app/components/formulario-dinamico/formulario-dinamico.component";
import { formularioRecursosAuditoria } from "src/app/data/forms/formulario-recursos-auditoria";
import { ModalService } from "src/app/services/modal.service";
import { formularioInformacionAuditoria } from "./editar-auditoria.utilidades";
import { map, Observable } from "rxjs";
import { BreakpointObserver } from "@angular/cdk/layout";

@Component({
  selector: "app-editar-auditoria",
  templateUrl: "./editar-auditoria.component.html",
  styleUrls: ["./editar-auditoria.component.css"],
})
export class EditarAuditoriaComponent implements OnInit {
  @ViewChild("stepper") stepper!: MatStepper;
  @ViewChild(ActividadesAuditoriaComponent)
  registroPlan!: ActividadesAuditoriaComponent;
  @ViewChild("formularioInformacionComp")
  formularioInformacionComponent!: FormularioDinamicoComponent;
  @ViewChild("formularioRecursosComp")
  formularioRecursosComponent!: FormularioDinamicoComponent;

  primerFormulario: FormGroup;
  segundoFormulario: FormGroup;
  tercerFormulario: FormGroup;
  cuartoFormulario: FormGroup;
  formularioInformacion: Formulario | undefined;
  formularioRecursos: Formulario | undefined;
  esLineal = false;
  orientation: "horizontal" | "vertical" = "horizontal";

  constructor(
    private _formBuilder: FormBuilder,
    private modalService: ModalService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.primerFormulario = this._formBuilder.group({});
    this.segundoFormulario = this._formBuilder.group({});
    this.tercerFormulario = this._formBuilder.group({});
    this.cuartoFormulario = this._formBuilder.group({});
  }

  ngOnInit() {
    this.iniciarFormularios();
    this.manejarResponsiveStepper();
  }

  ngAfterViewInit() {
    this.stepper.selectionChange.subscribe((event) => {
      if (event.previouslySelectedIndex === 3 && event.selectedIndex !== 3) {
        this.registroPlan.onStepLeave();
      }
    });
  }

  iniciarFormularios() {
    // Paso 1: Información
    this.primerFormulario = this._formBuilder.group({
      secondCtrl: ["", Validators.required],
    });
    // Paso 2: Actividades
    this.segundoFormulario = this._formBuilder.group({
      secondCtrl: ["", Validators.required],
    });
    // Paso 3: Recursos
    this.tercerFormulario = this._formBuilder.group({
      campoRecursos: ["", Validators.required],
    });
    // Paso 4: Documentos Anexos
    this.cuartoFormulario = this._formBuilder.group({
      campoDocumentos: ["", Validators.required],
    });
    this.cargarFormulario();
  }

  cargarFormulario(): void {
    this.formularioInformacion = formularioInformacionAuditoria;
    this.formularioRecursos = formularioRecursosAuditoria;
  }

  guardarInformacion() {
    this.modalService
      .modalConfirmacion(
        " ",
        "warning",
        "¿Está seguro(a) de guardar la información?"
      )
      .then((result) => {
        if (result.isConfirmed) {
          this.formularioInformacionComponent.submitFormulario.subscribe(
            (formData: any) => {
              this.manejarEnvioInformacion(formData);
            }
          );
          this.enviarFormularioInformacion();
        }
      });
  }

  enviarFormularioInformacion(): void {
    if (this.formularioInformacionComponent) {
      this.formularioInformacionComponent.onSubmit();
    }
  }

  manejarEnvioInformacion(datos: any): void {
    if (datos) {
      console.log("Formulario de Información enviado:", datos);
      this.stepper.next();
    } else {
      console.error("Formulario de Información no válido");
    }
  }

  guardarRecursos() {
    this.modalService
      .modalConfirmacion(
        " ",
        "warning",
        "¿Está seguro(a) de guardar la información?"
      )
      .then((result) => {
        if (result.isConfirmed) {
          this.formularioRecursosComponent.submitFormulario.subscribe(
            (formData: any) => {
              this.manejarEnvioRecursos(formData);
            }
          );
          this.enviarFormularioRecursos();
        }
      });
  }

  enviarFormularioRecursos(): void {
    if (this.formularioRecursosComponent) {
      this.formularioRecursosComponent.onSubmit();
    }
  }

  manejarEnvioRecursos(datos: any): void {
    if (datos) {
      console.log("Formulario de Recursos enviado:", datos);
      this.stepper.next();
    } else {
      console.error("Formulario de Recursos no válido");
    }
  }

  finalizarAuditoria(): void {
    console.log("Auditoría finalizada");
  }

  manejarEnvioDocumentos(documentos: any) {
    console.log("Documentos guardados:", documentos);
    this.stepper.next();
  }

  manejarResponsiveStepper() {
    this.breakpointObserver
      .observe(["(max-width: 992px)"])
      .subscribe((result) => {
        this.orientation = result.matches ? "vertical" : "horizontal";
      });
  }
}
