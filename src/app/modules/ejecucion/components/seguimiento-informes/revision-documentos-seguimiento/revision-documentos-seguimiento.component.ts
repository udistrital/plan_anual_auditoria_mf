import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ModalRechazoSeguimientoComponent } from "./modal-rechazo-seguimiento/modal-rechazo-seguimiento.component";
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

@Component({
    selector: "app-revision-documentos-seguimiento",
    templateUrl: "./revision-documentos-seguimiento.component.html",
    styleUrl: "./revision-documentos-seguimiento.component.css",
    standalone: false
})
export class RevisionDocumentosSeguimientoComponent implements OnInit {
  auditoriaId: string = "";
  estadoInformeId!: number;
  selectedTab: number = 0;
  role: string | null = null;
  usuarioId: any;
  documentos: { base64: string; tipo_id: number }[] = [];
  opcionesDocumentos: { nombre: string; base64: string }[] = [];
  rolesAprobacion: { [key: string]: any } = {
    [environment.ROL.JEFE]: {
      estadoAprobacion: [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_INFORME_FINAL_JEFE],
      estadoRechazo: environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_INFORME_FINAL_JEFE,
      preguntaAprobacion: "¿Está seguro(a) de aprobar y enviar el informe final?",
      mensajeAprobacion: "El informe fue aprobado y enviado",
      botonAprobacion: "Aprobar y Enviar informe",
      botonRechazo: "Rechazar Informe",
    }
  };

  constructor(
    public readonly dialog: MatDialog,
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
    this.role = this.rolService.getRolPrioritario([
      environment.ROL.SECRETARIO,
      environment.ROL.AUDITOR_EXPERTO,
      environment.ROL.AUDITOR,
      environment.ROL.AUDITOR_ASISTENTE,
      environment.ROL.JEFE,
    ]);
  }

  cargarDocumentos() {
    this.documentos = [];
    this.opcionesDocumentos = [];

    let docInformeFinal = '';
    let docSolicitudInformacion = '';
    let docCompromisoEtnico = '';

    this.referenciaPdfService
      .consultarDocumentos(this.auditoriaId)
      .subscribe(async (res) => {
        const promesas = res.map(async (documento) => {
          const base64 = await this.nuxeoService.obtenerPorUUID(documento.nuxeo_enlace);
          this.documentos.push({ base64, tipo_id: documento.tipo_id });

          switch (documento.tipo_id) {
            case environment.TIPO_DOCUMENTO_PARAMETROS.INFORME_FINAL:
              docInformeFinal = base64;
              break;
            case environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO:
              docCompromisoEtnico = base64;
              break;
            case environment.TIPO_DOCUMENTO_PARAMETROS.SOLICITUD_INFORMACION:
              docSolicitudInformacion = base64;
              break;
          }
        });

        await Promise.all(promesas);

        const opciones = [
          { nombre: 'Informe Final', base64: docInformeFinal },
          { nombre: 'Oficio Anuncio Solicitud Información', base64: docSolicitudInformacion },
          { nombre: 'Compromiso Ético', base64: docCompromisoEtnico },
        ];

        this.opcionesDocumentos = opciones.filter(doc => !!doc.base64);

        if (this.selectedTab >= this.opcionesDocumentos.length) {
          this.selectedTab = 0;
        }
      });
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
    this.planAuditoriaService
      .get(`auditoria-estado?query=auditoria_id:${this.auditoriaId},actual:true`)
      .subscribe((res) => {
        this.estadoInformeId =
          res.Data[0]?.estado_id ?? environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL;
      });
  }

  mostrarAcciones(): boolean {
    const condicionesVisibilidad: { [key: string]: number[] } = {
      [environment.ROL.JEFE]: [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_INFORME_FINAL_JEFE],
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
