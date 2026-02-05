import { Component, OnInit, ViewChild } from "@angular/core";
import { MatStepper } from "@angular/material/stepper";
import { ActividadesSeguimientoComponent as ActividadesSeguimientoComponent } from "./actividades-seguimiento/actividades-seguimiento.component";
import { Formulario } from "src/app/shared/data/models/formulario.model";
import {
  formularioInformacionAuditoria,
} from "./editar-seguimiento.utilidades";
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
import { CrearActividadSeguimientoComponent } from "./actividades-seguimiento/crear-actividad/crear-actividad.component";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { establecerSelectsSecuenciales } from "src/app/shared/utils/formularios";
import { OikosService } from "src/app/core/services/oikos.service";


@Component({
  selector: "app-editar-seguimiento",
  templateUrl: "./editar-seguimiento.component.html",
  styleUrls: ["./editar-seguimiento.component.css"],
})
export class EditarSeguimientoComponent implements OnInit {
  @ViewChild("stepper") stepper!: MatStepper;

  @ViewChild(ActividadesSeguimientoComponent)
  registroPlan!: ActividadesSeguimientoComponent;

  @ViewChild("formularioInformacionComp")
  formularioInformacionComponent!: FormularioDinamicoComponent;
  formularioInformacion: Formulario | undefined;

  auditoriaId!: string;
  auditoria!: Auditoria;
  esLineal = false;
  orientation: "horizontal" | "vertical" = "horizontal";
  tipoSeleccionado: "macroproceso" | "proceso" | null = null;
  procesoElegido = 0;

  constructor(
    private readonly alertaService: AlertService,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly dialog: MatDialog,
    private readonly parametrosService: ParametrosService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly oikosSevice: OikosService
  ) {}

  ngOnInit() {
    this.cargarFormularios();
    this.manejarResponsiveStepper();
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
    this.obtenerAuditoria(this.auditoriaId);
  }

  ngAfterViewInit() {
    this.stepper.selectionChange.subscribe((event) => {
      if (event.previouslySelectedIndex === 2 && event.selectedIndex !== 2) {
        this.registroPlan.onStepLeave();
      }
    });

    establecerSelectsSecuenciales(this.formularioInformacionComponent, [
      "tipo",
      "proceso",
      "lider",
      "responsable",
    ]);
  }

  obtenerAuditoria(auditoriaId: string) {
    this.planAuditoriaMid.get(`auditoria/${auditoriaId}`).subscribe((res) => {
      this.auditoria = res.Data;
      this.cargarFormulariosConAuditoria();
    });
  }

  cargarFormularios(): void {
    this.formularioInformacion = formularioInformacionAuditoria;
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
      consecutivo_IE: informacion.consecutivo_IE,
      consecutivo_OCI: informacion.consecutivo_OCI,
      fecha_fin: informacion.fecha_ejecucion_final,
      fecha_inicio: informacion.fecha_ejecucion_inicial,
      lider_id: informacion.lider,
      no_auditoria: informacion.no_auditoria,
      macroproceso: informacion.proceso,
      responsable_id: informacion.responsable,
      tipo_id: informacion.tipo,
    };
  }

  finalizarAuditoria(): void {
    console.log("Auditoría finalizada");
  }

  manejarEnvioDocumentos(documentos: any) {
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
    this.router.navigate([`/planeacion/seguimiento`]);
  }

  subirArchivoCargueMasivo(): void {
    this.dialog.open(CargarArchivoComponent, {
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
    });

    if (this.auditoria.tipo_id) {
      this.manejarCambioTipo(this.auditoria.tipo_id);

      if (this.auditoria.macroproceso) {
        this.manejarCambioProceso(this.auditoria.macroproceso);

        if (this.auditoria.lider_id) {
          this.manejarCambioLider();
        }
      }
    }
  }

  crearActividad() {
    this.dialog.open(CrearActividadSeguimientoComponent, {
      width: "1100px",
      data: { auditoriaId: this.auditoriaId },
    });
  }

  private readonly selectActions: Record<string, (valor: any) => void> = {
    tipo: (valor) => this.manejarCambioTipo(valor),
    proceso: (valor) => this.manejarCambioProceso(valor),
    lider: () => this.manejarCambioLider(),
  };

  manejarCambioSelect(event: any): void {
    this.selectActions[event.campo.nombre]?.(event.valor);
  }

  manejarCambioTipo(tipoProcesoId: any) {
    const { MACROPROCESO, PROCESO, DEPENDENCIA } =
      environment.INFO_AUDITORIA.TIPOS_PROCESO.VALORES;

    this.tipoSeleccionado = null;
    if (tipoProcesoId === MACROPROCESO.PARAMETRO_ID) {
      this.tipoSeleccionado = "macroproceso";
    } else if (tipoProcesoId === PROCESO.PARAMETRO_ID) {
      this.tipoSeleccionado = "proceso";
    } else if (tipoProcesoId === DEPENDENCIA.PARAMETRO_ID) {
      return this.cargarDependencias();
    }

    const tipoParametroId =
      this.tipoSeleccionado === "macroproceso"
        ? MACROPROCESO.TIPO_PARAMETRO_ID
        : PROCESO.TIPO_PARAMETRO_ID;

    this.cargarOpciones("proceso", tipoParametroId);
  }

  manejarCambioProceso(procesoId: number) {
    this.procesoElegido = procesoId;
    this.cargarCargosLider("lider", procesoId);
  }

  manejarCambioLider() {
    this.cargarCargosResponsable("responsable");
  }

  cargarOpciones(campoNombre: string, tipoParametroId: number) {
    this.parametrosService
      .get(
        `parametro?query=TipoParametroId:${tipoParametroId}&fields=Id,Nombre&limit=0&sortby=Nombre&order=asc`
      )
      .subscribe((res) => {
        const campo = this.obtenerCampoFormulario(campoNombre);
        if (campo) campo.parametros!.opciones = res.Data;
      });
  }

  cargarCargosLider(campoNombre: string, procesoId: number) {
    const cargosLiderId = environment.INFO_AUDITORIA.CARGOS_LIDER_ID;
    const query =
      this.tipoSeleccionado === "macroproceso"
        ? `ParametroPadreId.ParametroPadreId.Id:${procesoId}`
        : `ParametroPadreId:${procesoId}`;

    this.parametrosService
      .get(
        `parametro?query=TipoParametroId:${cargosLiderId},${query}&fields=Id,Nombre&limit=0&sortby=Nombre&order=asc`
      )
      .subscribe((res) => {
        const campo = this.obtenerCampoFormulario(campoNombre);
        if (campo) campo.parametros!.opciones = res.Data;
      });
  }

  cargarCargosResponsable(campoNombre: string) {
    const cargosResponsableId =
      environment.INFO_AUDITORIA.CARGOS_RESPONSABLE_ID;
    const query =
      this.tipoSeleccionado === "macroproceso"
        ? `ParametroPadreId.ParametroPadreId.Id:${this.procesoElegido}`
        : `ParametroPadreId:${this.procesoElegido}`;

    this.parametrosService
      .get(
        `parametro?query=TipoParametroId:${cargosResponsableId},${query}&fields=Id,Nombre&limit=0&sortby=Nombre&order=asc`
      )
      .subscribe((res) => {
        const campo = this.obtenerCampoFormulario(campoNombre);
        if (campo) campo.parametros!.opciones = res.Data;
      });
  }

  obtenerCampoFormulario(nombreCampo: string) {
    return this.formularioInformacion?.campos?.find(
      (campo) => campo.nombre === nombreCampo
    );
  }

  /**
   * Loads the list of dependencies into the "proceso" field options.
   * TODO: Currently, the domain of the depenencia id is not part of the proceso field in parametros API.
   */
  cargarDependencias() {
    this.oikosSevice
      .get(
        `dependencia?query=Activo:true&limit=0&sortby=nombre&order=asc&fields=Id,Nombre`
      )
      .subscribe((res) => {
        const campo = this.obtenerCampoFormulario("proceso");
        if (campo) campo.parametros!.opciones = res;
      });
  }
}
