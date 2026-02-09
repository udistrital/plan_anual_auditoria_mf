import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ModalRechazoAuditoriaEjecucionComponent } from "./modal-rechazo-auditoria/modal-rechazo-auditoria.component";
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
  selector: "app-revision-documentos-ejecucion",
  templateUrl: "./revision-documentos.component.html",
  styleUrl: "./revision-documentos.component.css",
})
export class RevisionDocumentosEjecucionComponent implements OnInit {
  auditoriaId: string = "";
  estadoInformeId!: number;
  selectedTab: number = 0;
  role: string | null = null;
  usuarioId: any;
  documentos: { base64: string; tipo_id: number }[] = [];
  opcionesDocumentos: { nombre: string; base64: string }[] = [
    { nombre: "Informe Preliminar", base64: "" },
    { nombre: "Programa de Trabajo", base64: "" },
    { nombre: "Oficio Anuncio Solicitud Información", base64: "" },
    { nombre: "Carta de Representación", base64: "" },
    { nombre: "Compromiso Ético del Auditor Interno", base64: "" },
  ];
  rolesAprobacion: { [key: string]: any } = {
    jefe: {
      estadoAprobacion: [
        environment.INFORME_ESTADO.INFORME_PRELIMINAR_APROBADO_POR_JEFE_ID,
        environment.INFORME_ESTADO.INFORME_PRELIMINAR_EN_REVISION_POR_AUDITADO_ID,
      ],
      estadoRechazo: environment.INFORME_ESTADO.INFORME_PRELIMINAR_RECHAZADO_POR_JEFE_ID,
      preguntaAprobacion: "¿Está seguro(a) de enviar el informe preliminar al auditado?",
      mensajeAprobacion: "El informe fue enviado al auditado",
      botonAprobacion: "Aprobar y Enviar a Auditado",
      botonRechazo: "Rechazar Informe",
    },
    auditado: {
      estadoAprobacion: [environment.INFORME_ESTADO.INFORME_PRELIMINAR_APROBADO_POR_AUDITADO_ID],
      estadoRechazo: environment.INFORME_ESTADO.INFORME_PRELIMINAR_RESPUESTA_POR_AUDITADO_ID,
      preguntaAprobacion: "¿Está seguro(a) de enviar la respuesta preliminar al auditor?",
      mensajeAprobacion: "El informe fue enviado al auditor(a)",
      botonAprobacion: "Aceptar informe",
      botonRechazo: "Respuesta Preliminar",
      modalRechazo: {
        titulo: "Respuesta Preliminar",
        descripcion: "Descripción respuesta del auditado",
        labelTextarea: "Descripción respuesta del auditado",
        botonConfirmar: "Guardar",
        mensajeConfirmacion: "¿Está seguro(a) de enviar la respuesta preliminar a auditor?",
        mensajeExito: "Informe preliminar enviado",
        descripcionExito: "El informe fue enviado al auditor(a)",
      },
    },
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

      this.role = "auditado"; // TODO: Eliminar, se utilizo solo para pruebas
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
        this.aprobarAuditoria(estados, rolAprobacion.mensajeAprobacion);
      });
  }

  async aprobarAuditoria(estados: number[], mensajeAprobacion: string) {
    try {
      for (const estado of estados) {
        const auditoriaEstado = this.construirObjetoAuditoriaEstado(estado);
        await this.planAuditoriaService.post("auditoria-estado", auditoriaEstado).toPromise();
      }

      this.alertService.showSuccessAlert(mensajeAprobacion, "Informe preliminar enviado");
      this.router.navigate([`/ejecucion/auditorias-internas/`]);
    } catch (error) {
      this.alertService.showErrorAlert("Error al aprobar el informe.");
    }
  }

  construirObjetoAuditoriaEstado(estadoAprobacion: number) {
    return {
      auditoria_id: this.auditoriaId,
      usuario_id: this.usuarioId,
      usuario_rol: this.role,
      observacion: "",
      estado_interno_id: estadoAprobacion,
      estado_id: 0,
    };
  }

  abrirModalRechazo(): void {
    const rolConfig = this.rolesAprobacion[this.role!];
    const modalConfig = rolConfig?.modalRechazo;
    this.dialog.open(ModalRechazoAuditoriaEjecucionComponent, {
      width: "50%",
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
    this.router.navigate([`/ejecucion/auditorias-internas`]);
  }

  cargarEstadoInforme() {
    // TODO: Cargar el estado del informe y cambiar:
    // this.estadoInformeId = environment.INFORME_ESTADO.INFORME_PRELIMINAR_EN_REVISION_POR_JEFE_ID; // TODO: Eliminar, utillizado pruebas (Para el jefe)
    this.estadoInformeId = environment.INFORME_ESTADO.INFORME_PRELIMINAR_EN_REVISION_POR_AUDITADO_ID // TODO: Eliminar, utillizado pruebas (Para el auditado)
  }

  mostrarAcciones(): boolean {
    const condicionesVisibilidad: { [key: string]: number[] } = {
      jefe: [environment.INFORME_ESTADO.INFORME_PRELIMINAR_EN_REVISION_POR_JEFE_ID],
      auditado: [environment.INFORME_ESTADO.INFORME_PRELIMINAR_EN_REVISION_POR_AUDITADO_ID],
    };

    return condicionesVisibilidad[this.role!]?.includes(this.estadoInformeId) || false;
    // return true // TODO: Eliminar, sirve para probar (ver todas las acciones)
  }

  async descargarTodo() {
    try {
      await this.descargaService.descargarMultiplesArchivos(this.documentos, "documentos.zip");
    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error);
    }
  }
}
