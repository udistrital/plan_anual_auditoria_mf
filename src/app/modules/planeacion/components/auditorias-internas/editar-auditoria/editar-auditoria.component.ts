import { Component, OnInit, ViewChild } from "@angular/core";
import { MatStepper } from "@angular/material/stepper";
import { ActividadesAuditoriaComponent } from "./actividades-auditoria/actividades-auditoria.component";
import { Formulario } from "src/app/shared/data/models/formulario.model";
import {
  formularioInformacionAuditoria,
  formularioRecursosAuditoria,
} from "./editar-auditoria.utilidades";
import { BreakpointObserver } from "@angular/cdk/layout";
import { AlertService } from "src/app/shared/services/alert.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { FormularioDinamicoComponent } from "src/app/shared/elements/components/formulario-dinamico/formulario-dinamico.component";
import { Router, ActivatedRoute } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { CargarArchivoComponent } from "src/app/shared/elements/components/cargar-archivo/cargar-archivo.component";
import { environment } from "src/environments/environment";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { Auditoria } from "src/app/shared/data/models/auditoria";
import { CrearActividadComponent } from "./actividades-auditoria/crear-actividad/crear-actividad.component";
import { ParametrosService } from "src/app/core/services/parametros.service";
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
  formularioInformacion: Formulario | undefined;

  @ViewChild("formularioRecursosComp")
  formularioRecursosComponent!: FormularioDinamicoComponent;
  formularioRecursos: Formulario | undefined;

  auditoriaId!: string;
  auditoria!: Auditoria;
  esLineal = false;
  orientation: "horizontal" | "vertical" = "horizontal";

  constructor(
    private readonly alertaService: AlertService,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly dialog: MatDialog,
    private readonly parametrosService: ParametrosService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid
  ) {}

  ngOnInit() {
    this.cargarFormularios();
    this.manejarResponsiveStepper();
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
    this.obtenerAuditoria(this.auditoriaId);
  }

  ngAfterViewInit() {
    this.stepper.selectionChange.subscribe((event) => {
      if (event.previouslySelectedIndex === 3 && event.selectedIndex !== 3) {
        this.registroPlan.onStepLeave();
      }
    });
  }

  obtenerAuditoria(auditoriaId: string) {
    this.planAuditoriaMid.get(`auditoria/${auditoriaId}`).subscribe((res) => {
      this.auditoria = res.Data;
      this.cargarFormulariosConAuditoria();
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
    const auditoriaId = this.auditoria._id;
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
    const auditoriaId = this.auditoria._id;
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

  regresarRuta() {
    this.router.navigate([`/planeacion/auditorias-internas`]);
  }

  subirArchivoCargueMasivo(): void {
    const dialogRef = this.dialog.open(CargarArchivoComponent, {
      width: "800px",
      data: {
        tipoArchivo: "xlsx",
        id: this.auditoriaId,
        idTipoDocumento: environment.TIPO_DOCUMENTO.PLANES_AUDITORIA,
        descripcion: "Archivo para cargue masivo de actividades",
        cargaLambda: true,
        tipo: "actividades",
      },
    });
  }

  cargarFormulariosConAuditoria() {
    this.formularioInformacionComponent.form.patchValue({
      no_auditoria: this.auditoria.no_auditoria,
      consecutivo_OCI: this.auditoria.consecutivo_OCI,
      consecutivo_IE: this.auditoria.consecutivo_IE,
      tipo: this.auditoria.tipo_id,
      proceso: this.auditoria.macroproceso,
      lider: this.auditoria.lider_id,
      responsable: this.auditoria.responsable_id,
      fecha_ejecucion_inicial: this.auditoria.fecha_inicio,
      fecha_ejecucion_final: this.auditoria.fecha_fin,
      objetivo_auditoria: this.auditoria.objetivo,
      alcance_auditoria: this.auditoria.alcance,
      criterios: this.auditoria.criterio,
    });

    this.formularioRecursosComponent.form.patchValue({
      tecnologicos: this.auditoria.rec_tecnologico,
      humanos: this.auditoria.rec_humano,
      fisicos: this.auditoria.rec_fisico,
    });
  }

  crearActividad() {
    const dialogRef = this.dialog.open(CrearActividadComponent, {
      width: "1100px",
      data: { auditoriaId: this.auditoriaId },
    });
  }

  private readonly selectActions: { [key: string]: (valor: any) => void } = {
    tipo: (valor) => this.manejarCambioSelectTipo(valor),
    proceso: (valor) => this.cargarCargosLider(valor),
  };

  manejarCambioSelect(event: any): void {
    const action = this.selectActions[event.campo.nombre];
    if (action) {
      action(event.valor);
    }
  }

  manejarCambioSelectTipo(tipoProcesoId: any) {
    const valores = environment.INFO_AUDITORIA.TIPOS_PROCESO.VALORES;
    if (tipoProcesoId == valores.MACROPROCESO.PARAMETRO_ID) {
      this.cargarMacropocesos();
    } else if (tipoProcesoId == valores.PROCESO.PARAMETRO_ID) {
      this.cargarProcesos();
    }
  }

  cargarMacropocesos() {
    const macroprocesoId =
      environment.INFO_AUDITORIA.TIPOS_PROCESO.VALORES.MACROPROCESO
        .TIPO_PARAMETRO_ID;

    let macroprocesos: any[] = [];

    this.parametrosService
      .get(
        `parametro?query=TipoParametroId:${macroprocesoId}&fields=Id,Nombre&limit=0&sortby=Nombre&order=asc`
      )
      .subscribe((res) => {
        macroprocesos = res.Data;

        // Actualiza las opciones del select 'proceso'
        const selectProceso = this.formularioInformacion!.campos!.find(
          (campo) => campo.nombre === "proceso"
        );
        selectProceso!.parametros!.opciones = macroprocesos;
      });
  }

  cargarProcesos() {
    const procesoId =
      environment.INFO_AUDITORIA.TIPOS_PROCESO.VALORES.PROCESO
        .TIPO_PARAMETRO_ID;

    let procesos: any[] = [];

    this.parametrosService
      .get(
        `parametro?query=TipoParametroId:${procesoId}&fields=Id,Nombre&limit=0&sortby=Nombre&order=asc`
      )
      .subscribe((res) => {
        procesos = res.Data;

        // Actualiza las opciones del select 'proceso'
        const selectProceso = this.formularioInformacion!.campos!.find(
          (campo) => campo.nombre === "proceso"
        );
        selectProceso!.parametros!.opciones = procesos;
      });
  }

  cargarCargosLider(procesoId: number) {
    const cargosLiderId = environment.INFO_AUDITORIA.CARGOS_LIDER_ID;

    let cargosLider: any[] = [];

    this.parametrosService
      .get(
        `parametro?query=TipoParametroId:${cargosLiderId},ParametroPadreId:${procesoId}&fields=Id,Nombre&limit=0&sortby=Nombre&order=asc`
      )
      .subscribe((res) => {
        cargosLider = res.Data;

        // Actualiza las opciones del select 'lider'
        const selectLider = this.formularioInformacion!.campos!.find(
          (campo) => campo.nombre === "lider"
        );
        selectLider!.parametros!.opciones = cargosLider;
      });
  }
}
