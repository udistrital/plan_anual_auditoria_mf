import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ModalRechazoAuditoriaEjecucionComponent } from "./modal-rechazo-auditoria/modal-rechazo-auditoria.component";
import { MatDialog } from "@angular/material/dialog";
import { environment } from "src/environments/environment";

//Servicios
import { RolService } from "src/app/core/services/rol.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { UserService } from "src/app/core/services/user.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { DescargaService } from "src/app/shared/services/descarga.service";

const configAuditado = {
  estadoAprobacion: [
    environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO
  ],
  estadoRechazo: environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO,
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
};

const configJefe = {
  estadoAprobacion: [
    environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_JEFE,
    environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO,
  ],
  estadoRechazo: environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_PREINFORME_JEFE,
  preguntaAprobacion: "¿Está seguro(a) de enviar el informe preliminar al auditado?",
  mensajeAprobacion: "El informe fue enviado al auditado",
  botonAprobacion: "Aprobar y Enviar a Auditado",
  botonRechazo: "Rechazar Informe",
};

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
    [environment.ROL.JEFE]: configJefe,
    [environment.ROL.JEFE_DEPENDENCIA]: configAuditado,
    [environment.ROL.ASISTENTE_DEPENDENCIA]: configAuditado,
  };

  constructor(
    public dialog: MatDialog,
    private readonly alertService: AlertService,
    private readonly rolService: RolService,
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
    this.obtenerRolPrioritario();
    this.userService.getPersonaId().then((usuarioId) => { this.usuarioId = usuarioId; });
    this.cargarDocumentos();
  }

  obtenerRolPrioritario() {
    const rolPrioridad = [
      environment.ROL.SECRETARIO,
      environment.ROL.AUDITOR_EXPERTO,
      environment.ROL.AUDITOR,
      environment.ROL.AUDITOR_ASISTENTE,
      environment.ROL.JEFE,
    ];
    this.role = rolPrioridad.find(rol => this.rolService.tieneRol(rol)) ?? null;
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
      fase_id: environment.AUDITORIA_FASE.EJECUCION_PRELIMINAR,
      estado_id: estadoAprobacion,
      usuario_id: this.usuarioId,
      usuario_rol: this.role,
      observacion: "",
    };
  }

  abrirModalRechazo(): void {
    const rolConfig = this.rolesAprobacion[this.role!];
    const modalConfig = rolConfig?.modalRechazo;
    this.dialog.open(ModalRechazoAuditoriaEjecucionComponent, {
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
    this.router.navigate([`/ejecucion/auditorias-internas`]);
  }

  cargarEstadoInforme() {
    // TODO: Cargar el estado del informe y cambiar:
    this.estadoInformeId = environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE; // TODO: Eliminar, utillizado pruebas (Para el jefe)
    // this.estadoInformeId = environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO; // TODO: Eliminar, utillizado pruebas (Para el auditado)
  }

  mostrarAcciones(): boolean {
    const condicionesVisibilidad: { [key: string]: number[] } = {
      [environment.ROL.JEFE]: [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE],
      [environment.ROL.JEFE_DEPENDENCIA]: [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO],
      [environment.ROL.ASISTENTE_DEPENDENCIA]: [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO],
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
