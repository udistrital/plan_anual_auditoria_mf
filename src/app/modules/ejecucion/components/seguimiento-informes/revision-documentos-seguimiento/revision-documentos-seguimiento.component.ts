import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ModalRechazoSeguimientoComponent } from "./modal-rechazo-seguimiento/modal-rechazo-seguimiento.component";
import { MatDialog } from "@angular/material/dialog";
import { environment } from "src/environments/environment";

//Servicios
import { ImplicitAutenticationService } from "src/app/core/services/implicit_autentication.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { UserService } from "src/app/core/services/user.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { DescargaService } from "src/app/shared/services/descarga.service";

@Component({
  selector: "app-revision-documentos-seguimiento",
  templateUrl: "./revision-documentos-seguimiento.component.html",
  styleUrl: "./revision-documentos-seguimiento.component.css",
})
export class RevisionDocumentosSeguimientoComponent implements OnInit {
  auditoriaId: string = "";
  estadoInformeId!: number;
  selectedTab: number = 0;
  role: string | null = null;
  usuarioId: any;
  documentos: { base64: string; tipo_id: number }[] = [];
  opcionesDocumentos: { nombre: string; base64: string }[] = [
    { nombre: "Informe final", base64: "" },
    { nombre: "Oficio Anuncio Solicitud Información", base64: "" }
  ];
  rolesAprobacion: { [key: string]: any } = {
    jefe: {
      estadoAprobacion: [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_INFORME_FINAL_JEFE],
      estadoRechazo: environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_INFORME_FINAL_JEFE,
      preguntaAprobacion: "¿Está seguro(a) de enviar el informe final a auditado?",
      mensajeAprobacion: "El informe fue enviado a auditado",
      botonAprobacion: "Aprobar y Enviar a Auditado",
      botonRechazo: "Rechazar Informe",
    }
  };

  constructor(
    public dialog: MatDialog,
    private readonly alertService: AlertService,
    private readonly autenticationService: ImplicitAutenticationService,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService,
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly nuxeoService: NuxeoService,
    private readonly descargaService: DescargaService
  ) { }

  ngOnInit(): void {
    this.inicializarDatos();
    this.cargarEstadoInforme();
  }

  inicializarDatos() {
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
    this.buscarRol();
    this.userService.getPersonaId().then((usuarioId) => { this.usuarioId = usuarioId; });
    this.cargarDocumentos();
  }

  // TODO: No se abarcan todos los roles
  buscarRol() {
    this.autenticationService.getRole().then((roles: any) => {
      if (!roles || roles.length === 0) {
        return;
      }
      console.log(roles);

      const esSecretario = roles.includes("SECRETARIO_AUDITOR");
      const esAuditor = roles.some(
        (role: string) => role === "AUDITOR_EXPERTO" || role === "AUDITOR"
      );
      const esJefe = roles.includes("JEFE_CONTROL_INTERNO");

      this.role = esSecretario
        ? "secretario"
        : esAuditor
          ? "auditor"
          : esJefe
            ? "jefe"
            : null;
    });
  }

  cargarDocumentos() {
    console.log("Cargar documentos");
  }

  preguntarAprobacion() {
    const rolAprobacion = this.rolesAprobacion[this.role!];
    if (!rolAprobacion) return;

    const estados = Array.isArray(rolAprobacion.estadoAprobacion)
      ? rolAprobacion.estadoAprobacion
      : [rolAprobacion.estadoAprobacion];

    this.alertService
      .showConfirmAlert(rolAprobacion.preguntaAprobacion)
      .then(confirmado => {
        if (!confirmado.value) return;
        this.aprobarSeguimiento(estados, rolAprobacion.mensajeAprobacion);
      });
  }

  async aprobarSeguimiento(estados: number[], mensajeAprobacion: string) {
    try {
      for (const estado of estados) {
        const seguimientoEstado = this.construirObjetoSeguimientoEstado(estado);
        await this.planAuditoriaService.post("auditoria-estado", seguimientoEstado).toPromise();
      }

      this.alertService.showSuccessAlert(mensajeAprobacion, "Informe final enviado");
      this.router.navigate([`/ejecucion/seguimiento-informes/`]);
    } catch (error) {
      this.alertService.showErrorAlert("Error al aprobar el informe.");
    }
  }

  construirObjetoSeguimientoEstado(estadoAprobacion: number) {
    return {
      auditoria_id: this.auditoriaId,
      fase_id: environment.AUDITORIA_FASE.EJECUCION_FINAL,
      estado_id: estadoAprobacion,
      usuario_id: this.usuarioId,
      usuario_rol: this.role,
      observacion: "",
    };
  }

  abrirModalRechazo(): void {
    const rolConfig = this.rolesAprobacion[this.role!];
    const modalConfig = rolConfig?.modalRechazo;
    this.dialog.open(ModalRechazoSeguimientoComponent, {
      width: "40%",
      data: {
        usuarioId: this.usuarioId,
        role: this.role,
        auditoriaId: this.auditoriaId,
        estadoRechazo: rolConfig?.estadoRechazo,
        ...modalConfig,
      },
    });
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }

  regresarRuta() {
    this.router.navigate([`/ejecucion/seguimiento-informes`]);
  }

  cargarEstadoInforme() {
    // TODO: Cargar el estado del informe y cambiar:
    this.estadoInformeId = environment.AUDITORIA_ESTADO.EJECUCION.REVISION_INFORME_FINAL_JEFE
  }

  mostrarAcciones(): boolean {
    const condicionesVisibilidad: { [key: string]: number[] } = {
      jefe: [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_INFORME_FINAL_JEFE],
    };
    return condicionesVisibilidad[this.role!]?.includes(this.estadoInformeId) || false;
  }

  async descargarTodo() {
    try {
      await this.descargaService.descargarMultiplesArchivos(this.documentos, "documentos-seguimiento.zip");
    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error);
    }
  }
}
