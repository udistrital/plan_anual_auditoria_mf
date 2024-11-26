import { Component, OnInit, ViewChild } from "@angular/core";
import { MatStepper } from "@angular/material/stepper";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActividadesAuditoriaComponent } from "./actividades-auditoria/actividades-auditoria.component";
import { Formulario } from "src/app/shared/data/models/formulario.model";
import { FormularioDinamicoComponent } from "src/app/shared/components/formulario-dinamico/formulario-dinamico.component";
import { ModalService } from "src/app/shared/services/modal.service";
import {
  formularioInformacionAuditoria,
  formularioRecursosAuditoria,
} from "./editar-auditoria.utilidades";
import { map, Observable } from "rxjs";
import { BreakpointObserver } from "@angular/cdk/layout";
import { AlertService } from "src/app/shared/services/alert.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";

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
  formularioInformacion: Formulario | undefined;
  formularioRecursos: Formulario | undefined;
  esLineal = false;
  orientation: "horizontal" | "vertical" = "horizontal";

  constructor(
    private _formBuilder: FormBuilder,
    private alertaService: AlertService,
    private breakpointObserver: BreakpointObserver,
    private modalService: ModalService,
    private planAuditoriaService: PlanAnualAuditoriaService
  ) {}

  ngOnInit() {
    this.cargarFormularios();
    this.manejarResponsiveStepper();
  }

  ngAfterViewInit() {
    this.stepper.selectionChange.subscribe((event) => {
      if (event.previouslySelectedIndex === 3 && event.selectedIndex !== 3) {
        this.registroPlan.onStepLeave();
      }
    });
  }

  cargarFormularios(): void {
    this.formularioInformacion = formularioInformacionAuditoria;
    this.formularioRecursos = formularioRecursosAuditoria;
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
    const auditoriaId = "673ce5d37cf5a06432446c5a";
    const informacionEditar = this.mapearInfoFormInformacion(informacion);
    console.log(informacionEditar);

    this.planAuditoriaService
      .put(`auditoria/${auditoriaId}`, informacionEditar)
      .subscribe((res) => {
        this.alertaService.showSuccessAlert(
          "Información editados correctamente"
        );
        this.stepper.next();
      });
  }

  mapearInfoFormInformacion(informacion: any) {
    return {
      alcance: informacion.alcance_auditoria,
      consecutivo_IE: informacion.consecutivo_IE,
      consecutivo_OCI: informacion.consecutivo_OCI,
      criterio: informacion.criterios,
      fecha_fin: informacion.fecha_ejecucion_final,
      fecha_inicio: informacion.fecha_ejecucion_inicial,
      lider_id: informacion.lider,
      no_auditoria: informacion.no_auditoria,
      objetivo: informacion.objetivo_auditoria,
      macroproceso: informacion.proceso,
      responsable_id: informacion.responsable,
      tipo_id: informacion.tipo,
    };
  }

  enviarFormRecursos() {
    this.formularioRecursosComponent.onSubmit();
  }

  preguntarGuardadoRecursos(dataForm: any) {
    if (!dataForm) {
      return this.alertaService.showAlert(
        "Formulario incompleto",
        "Debe llenar todos los campos obligatorios"
      );
    }

    this.alertaService
      .showConfirmAlert("¿Está seguro(a) de guardar los recursos?")
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }
        this.guardarRecursos(dataForm);
      });
  }

  guardarRecursos(recursos: any) {
    //todo: id quemado
    const auditoriaId = "673ce5d37cf5a06432446c5a";
    const recursosEditar = {
      rec_tecnologico: recursos.tecnologicos,
      rec_humano: recursos.humanos,
      rec_fisico: recursos.fisicos,
    };

    this.planAuditoriaService
      .put(`auditoria/${auditoriaId}`, recursosEditar)
      .subscribe((res) => {
        this.alertaService.showSuccessAlert("Recursos editados correctamente");
        this.stepper.next();
      });
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
