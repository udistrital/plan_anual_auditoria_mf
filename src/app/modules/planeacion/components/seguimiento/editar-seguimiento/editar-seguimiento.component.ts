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
import { RolService } from "src/app/core/services/rol.service";
import { UserService } from "src/app/core/services/user.service";


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
  usuarioId: number = 0;

  constructor(
    private readonly alertaService: AlertService,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly dialog: MatDialog,
    private readonly parametrosService: ParametrosService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly rolService: RolService,
    private readonly userService: UserService
  ) {}

  ngOnInit() {
    this.cargarFormularios();
    this.manejarResponsiveStepper();
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
    this.obtenerAuditoria(this.auditoriaId);
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
    });
  }

  ngAfterViewInit() {
    this.stepper.selectionChange.subscribe((event) => {
      if (event.previouslySelectedIndex === 2 && event.selectedIndex !== 2) {
        this.registroPlan.onStepLeave();
      }
    });

    establecerSelectsSecuenciales(this.formularioInformacionComponent, [
      "proceso",
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

  cambiarEstado() {
    const estadoPayload = {
      auditoria_id: this.auditoria._id,
      estado_id: environment.AUDITORIA_ESTADO.PLANEACION.CREANDO_PROGRAMA,
      fase_id: environment.AUDITORIA_FASE.PLANEACION,
      usuario_id: this.usuarioId,
      usuario_rol: [environment.ROL.AUDITOR_EXPERTO, environment.ROL.AUDITOR, environment.ROL.AUDITOR_ASISTENTE].find(rol => this.rolService.tieneRol(rol))
    }
    return this.planAuditoriaService.post("auditoria-estado", estadoPayload)
  }

  guardarInformacion(informacion: any) {
    const auditoriaId = this.auditoria._id;
    const informacionEditar = this.mapearInfoFormInformacion(informacion);

    this.planAuditoriaService
      .put(`auditoria/${auditoriaId}`, informacionEditar)
      .subscribe((res) => {
        this.cambiarEstado().subscribe(() => {
          this.alertaService.showSuccessAlert(
            "Información editados correctamente"
          );
          
        });
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
      responsable_id: informacion.responsable,
      correo_complementario: informacion.correo_complementario,
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
      macroproceso: this.auditoria.macroproceso_nombre,
      proceso: this.auditoria.proceso_nombre,
      dependencia: this.auditoria.dependencia_nombre,
      jefe_nombre: this.auditoria.jefe_nombre,
      asistente_nombre: this.auditoria.asistente_nombre,
      fecha_ejecucion_inicial: this.auditoria.fecha_inicio,
      fecha_ejecucion_final: this.auditoria.fecha_fin,
      jefe_correo: this.auditoria.jefe_correo,
      asistente_correo: this.auditoria.asistente_correo,
      correo_dependencia: this.auditoria.correo_dependencia,
      correo_complementario: this.auditoria.correo_complementario,
    });
    
  }

  crearActividad() {
    this.dialog.open(CrearActividadSeguimientoComponent, {
      width: "1100px",
      data: { auditoriaId: this.auditoriaId },
    });
  }

  private readonly selectActions: Record<string, (valor: any) => void> = {
    macroproceso: (valor) => this.manejarCambioMacroproceso(valor),
  };

  manejarCambioSelect(event: any): void {
    this.selectActions[event.campo.nombre]?.(event.valor);
  }

  manejarCambioMacroproceso(tipoProcesoId: any) {
    const { MACROPROCESO, PROCESO } =
      environment.INFO_AUDITORIA.TIPOS_PROCESO.VALORES;

    this.tipoSeleccionado = null;
    if (tipoProcesoId === MACROPROCESO.PARAMETRO_ID) {
      this.tipoSeleccionado = "macroproceso";
    } else if (tipoProcesoId === PROCESO.PARAMETRO_ID) {
      this.tipoSeleccionado = "proceso";
    }

    const tipoParametroId =
      this.tipoSeleccionado === "macroproceso"
        ? MACROPROCESO.TIPO_PARAMETRO_ID
        : PROCESO.TIPO_PARAMETRO_ID;

    this.cargarOpciones("proceso", tipoParametroId);
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

  obtenerCampoFormulario(nombreCampo: string) {
    return this.formularioInformacion?.campos?.find(
      (campo) => campo.nombre === nombreCampo
    );
  }

}
