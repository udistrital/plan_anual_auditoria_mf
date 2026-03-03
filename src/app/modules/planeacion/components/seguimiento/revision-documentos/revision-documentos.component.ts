import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ModalRechazoSeguimientoComponent } from "./modal-rechazo-seguimiento/modal-rechazo-seguimiento.component";
import { MatDialog } from "@angular/material/dialog";
import { environment } from "src/environments/environment";
import { documentos, rolesAprobacion } from "./revision-documentos.utilidades";


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
  templateUrl: "./revision-documentos.component.html",
  styleUrl: "./revision-documentos.component.css",
})
export class RevisionDocumentosSeguimientoComponent implements OnInit {
  auditoriaId: string = "";
  estadoAuditoriaId!: number;
  tipoEvaluacionId!: number;
  tipoEvaluacion!: string;
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
    private readonly rolService: RolService,
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
    const tipoEvaluacionIdParam = this.route.snapshot.queryParamMap.get("tipoEvaluacionId");
    this.tipoEvaluacionId = Number(tipoEvaluacionIdParam ?? NaN) || environment.TIPO_EVALUACION.SEGUIMIENTO_ID; 
    this.tipoEvaluacion =
        this.tipoEvaluacionId === environment.TIPO_EVALUACION.INFORME_ID
        ? "informe"
        : "auditoria";

    this.opcionesDocumentos = documentos;
    this.rolesAprobacion = rolesAprobacion;
    this.obtenerRolPrioritario();
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

    let { estadoAprobacion, mensajeAprobacion, preguntaAprobacion } =
      rolAprobacion;

    // At this point, the variables estadoAprobacion, mensajeAprobacion and
    // preguntaAprobacion are still objects with 'auditoria' and 'informe' properties.
    //estadoAprobacion = estadoAprobacion[this.tipoEvaluacion];
    mensajeAprobacion = mensajeAprobacion[this.tipoEvaluacion];
    preguntaAprobacion = preguntaAprobacion[this.tipoEvaluacion];

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

  //funcion para registrar estados de auditoria secuencialmente,
  async aprobarAuditoriaSecuencial(
    estadoAprobacion: number[],
    mensajeAprobacion: string
  ) {
    try {
      for (const estado of estadoAprobacion) {
        await this.aprobarAuditoria(estado, mensajeAprobacion);
      }
    } catch (error) {
      this.alertService.showErrorAlert("Error al aprobar el plan.");
    }
  }

  async aprobarAuditoria(estadoAprobacion: number, mensajeAprobacion: string) {
    try {
      const auditoriaEstado =
        this.construirObjetoAuditoriaEstado(estadoAprobacion);

      this.planAuditoriaService
        .post("auditoria-estado", auditoriaEstado)
        .subscribe(() => {
          this.alertService.showSuccessAlert(
            mensajeAprobacion,
            "Auditoría enviada"
          ).then(() => {
            this.router.navigate([`/planeacion/seguimiento`]);
          });
        });
    } catch (error) {
      this.alertService.showErrorAlert("Error al aprobar el plan.");
    }
  }

  construirObjetoAuditoriaEstado(estadoAprobacion: number) {
    return {
      auditoria_id: this.auditoriaId,
      usuario_id: this.usuarioId,
      usuario_rol: this.role,
      observacion: "",
      estado_id: estadoAprobacion,
      fase_id: environment.AUDITORIA_FASE.PLANEACION,
    };
  }

  abrirModalRechazo(): void {
    this.dialog.open(ModalRechazoSeguimientoComponent, {
      width: "50%",
      data: {
        usuarioId: this.usuarioId,
        role: this.role,
        auditoriaId: this.auditoriaId,
        tipoEvaluacionId: this.tipoEvaluacionId,
      },
    });
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }

  regresarRuta() {
    this.router.navigate([`/planeacion/seguimiento`]);
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

  mostrarAcciones(role: string, estadoAuditoriaId: number): boolean {
    const condicionesVisibilidad: { [key: string]: number[] } = {
      [environment.ROL.JEFE]: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE],
      [environment.ROL.JEFE_DEPENDENCIA]: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO],
      [environment.ROL.ASISTENTE_DEPENDENCIA]: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO],
    };
    // retorna true, si el rol coincide con el estado de revision del rol
    return condicionesVisibilidad[role]?.includes(estadoAuditoriaId) || false;
  }

  cargarDocumentos() {
    this.referenciaPdfService
      .consultarDocumentos(this.auditoriaId)
      .subscribe(async (res) => {
        const promesas = res.map(async (documento) => {
          const base64 = await this.nuxeoService.obtenerPorUUID(documento.nuxeo_enlace);
          this.documentos.push({ base64, tipo_id: documento.tipo_id });
        });

        await Promise.all(promesas);
      });
  }

  /**
   * Gets the base64 string of a document by its type ID as defined in the
   * environment variables. 
   * 
   * @param key The key corresponding to the document type in the environment
   *            variables (e.g., "SOLICITUD_INFORMACION").
   * @returns The base64 string of the document if found; otherwise, an empty string.
   */
  getDocumentoBase64ByTIPO(key: string): string {
    const tipoId = environment.TIPO_DOCUMENTO_PARAMETROS[
          key as keyof typeof environment.TIPO_DOCUMENTO_PARAMETROS
        ];
    
    return this.documentos.find(doc => doc.tipo_id === tipoId)?.base64 || "";
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
