import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ModalRechazoAuditoriaComponent } from "./modal-rechazo-auditoria/modal-rechazo-auditoria.component";
import { MatDialog } from "@angular/material/dialog";
import { environment } from "src/environments/environment";
import { documentos, rolesAprobacion } from "./revision-documentos.utilidades";


//Servicios
import { ImplicitAutenticationService } from "src/app/core/services/implicit_autentication.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { UserService } from "src/app/core/services/user.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { DescargaService } from "src/app/shared/services/descarga.service";

@Component({
  selector: "app-revision-documentos",
  templateUrl: "./revision-documentos.component.html",
  styleUrl: "./revision-documentos.component.css",
})
export class RevisionDocumentosComponent implements OnInit {
  auditoriaId: string = "";
  estadoAuditoriaId!: number;
  selectedTab: number = 0;
  opcionesDocumentos: any;
  role: string | null = null;
  rolauditoriaIdesAprobacion: any;
  rolesAprobacion: any;
  usuarioId: any;
  documentos: { base64: string; tipo_id: number }[] = [];
  docProgramaTrabajo: string = "";
  docSolicitudInformacion: string = "";
  docCartaPresentacion: string = "";
  docCompromisoEstico: string = "";

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
  ) {}

  ngOnInit(): void {
    this.inicializarDatos();
    this.cargarEstadoAuditoria();
  }

  inicializarDatos() {
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
    this.opcionesDocumentos = documentos;
    this.rolesAprobacion = rolesAprobacion;
    this.buscarRol();
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
    });
    this.cargarDocumentos();
  }

  cargarEstadoAuditoria() {
    this.planAuditoriaService
      .get(
        `auditoria-estado?query=auditoria_id:${this.auditoriaId},actual:true`
      )
      .subscribe((res) => {
        this.estadoAuditoriaId =
          res.Data[0]?.estado_id ??
          environment.AUDITORIA_ESTADO.PROGRAMACION.BORRADOR_ID;
      });
  }

  preguntarAprobacionAuditoria() {
    const rolAprobacion = this.rolesAprobacion[this.role!];

    if (!rolAprobacion) {
      return; //si no hay rol
    }

    const { estadoAprobacion, mensajeAprobacion, preguntaAprobacion } =
      rolAprobacion;

    this.alertService
      .showConfirmAlert(preguntaAprobacion)
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }

        if (Array.isArray(estadoAprobacion)) {
          // Si es un array como en el caso del rol jefe, para hacer dos post para el flujo de estados
          this.aprobarAuditoriaSecuencial(estadoAprobacion, mensajeAprobacion);
        } else {
          this.aprobarAuditoria(estadoAprobacion, mensajeAprobacion);
        }
      });
  }

  async aprobarAuditoriaSecuencial(
    estadoAprobacion: number[],
    mensajeAprobacion: string
  ) {
    try {
      for (let i = 0; i < estadoAprobacion.length; i++) {
        const esUltimoEstado = i === estadoAprobacion.length - 1;
        await this.aprobarAuditoria(estadoAprobacion[i], mensajeAprobacion, esUltimoEstado);
      }
    } catch (error) {
      this.alertService.showErrorAlert("Error al aprobar el plan.");
    }
  }

  aprobarAuditoria(estadoAprobacion: number, mensajeAprobacion: string, mostrarMensaje: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
      const auditoriaEstado = this.construirObjetoAuditoriaEstado(estadoAprobacion);

      this.planAuditoriaService
        .post("auditoria-estado", auditoriaEstado)
        .subscribe({
          next: (res) => {
            if (mostrarMensaje) {
              this.alertService.showSuccessAlert(
                mensajeAprobacion,
                "Auditoría enviada"
              ).then(() => {
                this.router.navigate([`/planeacion/auditorias-internas/`]);
                resolve();
              });
            } else {
              resolve();
            }
          },
          error: (error) => {
            this.alertService.showErrorAlert("Error al aprobar el plan.");
            reject(error);
          }
        });
    });
  }

  construirObjetoAuditoriaEstado(estadoAprobacion: number) {
    return {
      auditoria_id: this.auditoriaId,
      usuario_id: this.usuarioId,
      usuario_rol: this.role,
      observacion: "",
      fase_id: environment.AUDITORIA_FASE.PLANEACION,
      estado_id: estadoAprobacion,
    };
  }

  abrirModalRechazo(): void {
    this.dialog.open(ModalRechazoAuditoriaComponent, {
      width: "50%",
      data: {
        usuarioId: this.usuarioId,
        role: this.role,
        auditoriaId: this.auditoriaId,
      },
    });
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }

  regresarRuta() {
    this.router.navigate([`/planeacion/auditorias-internas`]);
  }

  buscarRol() {
    this.autenticationService.getRole().then((roles: any) => {
      if (!roles || roles.length === 0) {
        return;
      }

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

  mostrarAcciones(role: string, estadoAuditoriaId: number): boolean {
    const condicionesVisibilidad: { [key: string]: number[] } = {
      jefe: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE],
      auditado: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO],
    };
    // retorna true, si el rol coincide con el estado de revision del rol
    return condicionesVisibilidad[role]?.includes(estadoAuditoriaId) || false;
  }

  cargarDocumentos() {
    const tipoDocumentoMap = {
      [environment.TIPO_DOCUMENTO_PARAMETROS.PROGRAMA_TRABAJO]:
        "docProgramaTrabajo",
      [environment.TIPO_DOCUMENTO_PARAMETROS.SOLICITUD_INFORMACION]:
        "docSolicitudInformacion",
      [environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION]:
        "docCartaPresentacion",
      [environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO]:
        "docCompromisoEtico",
    };

    this.referenciaPdfService
      .consultarDocumentos(this.auditoriaId)
      .subscribe(async (res) => {
        const promesas = res.map(async (documento) => {
          const base64 = await this.nuxeoService.obtenerPorUUID(documento.nuxeo_enlace);

          const propiedad = tipoDocumentoMap[documento.tipo_id];
          if (propiedad) {
            (this as any)[propiedad] = base64;
          }
    
          this.documentos.push({ base64, tipo_id: documento.tipo_id });
        });

        await Promise.all(promesas);
      });
  }

  async descargarTodo() {
    try {
      await this.descargaService.descargarMultiplesArchivos(
        this.documentos,
        "documentosAuditoria.zip"
      );
    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error);
    }
  }

}
