import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ModalMotivosRechazoComponent } from "./modal-motivos-rechazo/modal-motivos-rechazo.component";
import { environment } from "src/environments/environment";
import { ActivatedRoute, Router } from "@angular/router";
import { lastValueFrom, throwError, forkJoin, of } from 'rxjs';
import { switchMap, catchError, exhaustMap, tap, map } from 'rxjs/operators';
import { AlertService } from "src/app/shared/services/alert.service";
import { UserService } from "src/app/core/services/user.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { TercerosService } from "src/app/shared/services/terceros.service";
import { NotificacionesService, DestinatariosEmail, VariablesSolicitud } from "src/app/shared/services/notificaciones.service";
import { NotificacionRegistroCrudService } from "src/app/core/services/notificacion-registro-crud.service";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import rolRemitentePorRol from "src/app/shared/utils/rolRemitentePorRol";
import { RolService } from "src/app/core/services/rol.service";
import { DocumentoUtils, REFRESHABLES } from "../consulta-plan.auditoria.utils";
import { TabDocumento } from "src/app/shared/elements/components/dialogs/modal-ver-documentos/modal-ver-documentos.component";

@Component({
  selector: "app-revision-jefe",
  templateUrl: "./revision-jefe.component.html",
  styleUrls: ["./revision-jefe.component.css"],
})
export class RevisionJefeComponent implements OnInit {
  selectedTab: number = 0;
  botonSeleccionado: string = "formato";
  documentos: { base64: string; tipo_id: number }[] = [];
  documentosPorTab: { [key: number]: string } = {};
  tabs: TabDocumento[] = [];
  usuarioId: any;
  planAuditoriaId: string = "";
  estadoIdActual: number | null = null;
  mostrarBotones: boolean = true;
  roles: string[] = [];

  vigenciaNombre: string = "";

  constructor(
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private alertService: AlertService,
    private planAuditoriaService: PlanAnualAuditoriaService,
    private referenciaPdfService: ReferenciaPdfService,
    private nuxeoService: NuxeoService,
    private userService: UserService,
    private router: Router,
    private descargaService: DescargaService,
    private tercerosService: TercerosService,
    private notificacionesService: NotificacionesService,
    private notificacionRegistroCrudService: NotificacionRegistroCrudService,
    private parametrosUtilsService: ParametrosUtilsService,
    private rolService: RolService,
    private documentoUtils: DocumentoUtils,
  ) {}

  async ngOnInit() {
    console.debug("Inicializando RevisionJefeComponent...");
    this.planAuditoriaId = this.route.snapshot.paramMap.get("id") || "";
    this.roles = this.rolService.getRoles();
    this.obtenerVigenciaActual();
    this.obtenerEstadoActual();
    try {
      await this.renderizarDocumentos();
    } catch(error) {
      console.log("no se genero el base 64");
    }
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
    });
  }

  obtenerVigenciaActual(): void {
    forkJoin({
      plan: this.planAuditoriaService.get(`plan-auditoria/${this.planAuditoriaId}`),
      vigencias: this.parametrosUtilsService.getVigencias(),
    }).subscribe({
      next: ({ plan, vigencias }: any) => {
        console.debug("Plan obtenido:", plan);
        console.debug("Vigencias obtenidas:", vigencias);
        const vigenciaId = plan?.Data?.vigencia_id;
        console.debug("Vigencia ID obtenida del plan:", vigenciaId);
        const vigenciaNombre = vigencias?.find((v: any) => v.Id === vigenciaId)?.Nombre || "";
        console.debug("Vigencia Nombre encontrada:", vigenciaNombre);
        this.vigenciaNombre = vigenciaNombre || "";
      },
      error: (error) => {
        console.error("Error al obtener la vigencia:", error);
      }
    });
  }

  obtenerEstadoActual(): void {
    const callbacks = {
      [REFRESHABLES.FORMATO_PAA_ACTUALIZADO]: () =>
        this.renderizarDocumentos(),
    };
    this.planAuditoriaService
      .get(`estado?query=plan_auditoria_id:${this.planAuditoriaId},actual:true`)
      .subscribe({
        next: (response: any) => {
          const estadoActual = response?.Data?.[0];
          this.estadoIdActual = estadoActual?.estado_id || null;
          this.mostrarBotones =
            this.estadoIdActual === environment.PLAN_ESTADO.EN_REVISION_JEFE_ID;

          this.tabs = this.documentoUtils.getTabsVerDocumentos(this.planAuditoriaId, this.estadoIdActual || 0, this.roles, callbacks);
        },
        error: (error) => {
          console.error("Error al obtener el estado actual:", error);
          this.mostrarBotones = false;
          this.tabs = this.documentoUtils.getTabsVerDocumentos(this.planAuditoriaId, 0, this.roles, callbacks);
        }
      });
  }

  abrirModalRechazo(): void {
    if (!this.mostrarBotones) return;

    this.tercerosService.getAuthenticatedUserTerceroIdentification().subscribe({
      next: (tercero) => {
        this.dialog.open(ModalMotivosRechazoComponent, {
          width: "50%",
          data: {
            usuarioId: this.usuarioId,
            planAuditoriaId: this.planAuditoriaId,
            // nombre real del Jefe obtenido de Terceros
            nombreRemitente: tercero.NombreCompleto,
            // rol en lenguaje natural para el correo
            rolRemitente: rolRemitentePorRol[this.roles[0]] || "Jefe OCI",
          },
        });
      },
      error: (err) => {
        console.warn("Error obteniendo datos del Jefe para el modal:", err);
        // Si falla Terceros, se abre el modal igualmente con valores por defecto
        this.dialog.open(ModalMotivosRechazoComponent, {
          width: "50%",
          data: {
            usuarioId: this.usuarioId,
            planAuditoriaId: this.planAuditoriaId,
            nombreRemitente: "Jefe OCI",
            rolRemitente: rolRemitentePorRol[this.roles[0]] || "Jefe OCI",
          },
        });
      }
    });
  }

  abrirModalEnviar(): void {
    if (!this.mostrarBotones) return;

    this.alertService
      .showConfirmAlert(
        "¿Está seguro de enviar el Plan Anual de Auditoría? (PAA)?"
      )
      .then((confirmado) => {
        if (!confirmado.value) return;
        this.aprobarPlanAuditoria();
      });
  }

  aprobarPlanAuditoria() {
    const planEstadoAprobadoJefe = this.construirObjetoPlanEstado(
      this.planAuditoriaId,
      environment.PLAN_ESTADO.APROBADO_JEFE_ID
    );

    const planEstadoRevisionSecretario = this.construirObjetoPlanEstado(
      this.planAuditoriaId,
      environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID
    );

    this.planAuditoriaService.post("estado", planEstadoAprobadoJefe)
      .pipe(
        switchMap(() =>
          this.planAuditoriaService.post("estado", planEstadoRevisionSecretario)
        )
      )
      .subscribe({
        next: () => {
          this.alertService.showSuccessAlert(
            "Plan aceptado, el plan fue enviado al secretario."
          );
          this.router.navigate([`/programacion/plan-auditoria/`]);

          this.notificarEnvioAComite();
        },
        error: (error) => {
          this.alertService.showErrorAlert(
            "Error al asociar los estados al plan."
          );
          console.error(error);
        }
      });
  }

  private notificarEnvioAComite(): void {
    const rolRemitente = rolRemitentePorRol[this.roles[0]] || "Jefe OCI";

    // en paralelo consultar plan, vigencias y tercero del Jefe autenticado
    forkJoin({
      plan: this.planAuditoriaService.get(`plan-auditoria/${this.planAuditoriaId}`),
      vigencias: this.parametrosUtilsService.getVigencias(),
      tercero: this.tercerosService.getAuthenticatedUserTerceroIdentification(),
    }).pipe(

      exhaustMap(({ plan, vigencias, tercero }: any) => {
        // Resolver nombre de vigencia desde el array de Parametros
        const vigenciaId = plan?.Data?.vigencia_id;
        const vigenciaObj = vigencias.find((v: any) => v.Id === vigenciaId);
        const vigenciaNombre = vigenciaObj?.Nombre || (vigenciaId ? String(vigenciaId) : "");

        console.log("vigenciaNombre Caso 3:", vigenciaNombre);

        // destinatarios del environment hasta definir flujo dinámico del Jefe
        const destinatarios: DestinatariosEmail = this.tercerosService.combinarDestinatarios(
          environment["NOTIFICACION_PLAN_AUDITORIA_DESTINATARIOS"].ToAddresses,
          environment["NOTIFICACION_PLAN_AUDITORIA_DESTINATARIOS"]
        );

        const variablesSolicitud: VariablesSolicitud = {
          titulo_solicitud: "Envío a Revisión del Comité - Plan Anual de Auditoría",
          tipo_solicitud: "revisión y aprobación por el comité",
          nombre_documento: "Plan Anual de Auditoría",
          // vigenciaNombre resuelta desde Parametros via forkJoin
          vigencia: vigenciaNombre,
          rol_remitente: rolRemitente,
          nombre_remitente: tercero.NombreCompleto || rolRemitente,
          fecha_envio: new Date().toLocaleDateString(),
        };

        console.debug("Enviando notificación de envío al comité:", {
          destinatarios,
          variablesSolicitud,
        });

        return this.notificacionesService.enviarNotificacionSolicitud(
          destinatarios,
          variablesSolicitud
        ).pipe(
          // tap ejecuta el registro en MongoDB sin modificar el flujo del observable
          tap((response: any) => {
            if (response?.Status == 200) {
              this.registrarNotificacion(destinatarios, variablesSolicitud, "envio_comite_paa");
            }
          })
        );
      }),

      catchError((error) => {
        console.warn("Error al enviar notificación de envío al comité:", error);
        return throwError(() => error);
      })

    ).subscribe({
      error: (err) => console.warn("Error en notificación de envío al comité:", err),
    });
  }

  private registrarNotificacion(
    destinatarios: DestinatariosEmail,
    variables: VariablesSolicitud,
    tipoNotificacion: string
  ): void {
    // Se registra un documento por cada destinatario (To + CC + BCC)
    const allDestinatarios = [
      ...(destinatarios.ToAddresses ?? []),
      ...(destinatarios.CcAddresses ?? []),
      ...(destinatarios.BccAddresses ?? []),
    ];

    allDestinatarios.forEach((correo) => {
      const payload = {
        destinatario: correo,
        fecha_envio: new Date(),
        metadatos: {
          // spread de variables incluye todos los campos de VariablesSolicitud
          ...variables,
          tipo_notificacion: tipoNotificacion,
          destinatarios_copia: destinatarios.CcAddresses ?? [],
          destinatarios_copia_oculta: destinatarios.BccAddresses ?? [],
        },
        // referencia_id vincula el registro con el plan de auditoría en MongoDB
        referencia_id: this.planAuditoriaId,
      };

      this.notificacionRegistroCrudService.post(payload).subscribe({
        next: (res) => console.debug("Registro de notificación guardado:", res),
        error: (err) => console.warn("Error guardando registro de notificación:", err),
      });
    });
  }

  construirObjetoPlanEstado(planId: string, estadoId: number, observacion = "") {
    return {
      plan_auditoria_id: planId,
      usuario_id: this.usuarioId,
      observacion,
      estado_id: estadoId,
    };
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }

  regresarRuta() {
    this.router.navigate([`/programacion/plan-auditoria`]);
  }

  async renderizarDocumentos() {
    try {
      this.documentos = [];
      this.documentosPorTab = {};

      const enlacesConTipo = await lastValueFrom(
        this.referenciaPdfService.consultarDocumentos(this.planAuditoriaId)
      );

      const enlaces = enlacesConTipo.map((doc) => doc.nuxeo_enlace);
      const base64Files = await this.nuxeoService.obtenerPorUUIDs(enlaces);

      enlacesConTipo.forEach((doc, index) => {
        const base64 = base64Files[index];
        this.documentos.push({ base64, tipo_id: doc.tipo_id });
      });

      const tabHolders = this.tabs.map((tab, i) => ({ idx: i, tab: tab }));
      this.documentos.forEach((doc) => {
        const holderIdx = tabHolders.findIndex(holder => holder.tab.tipoId === doc.tipo_id);
        if (holderIdx !== -1) {
          this.documentosPorTab[tabHolders[holderIdx].idx] = doc.base64;
          tabHolders.splice(holderIdx, 1);
        }
      });

    } catch (error) {
      console.error("Error al renderizar los documentos:", error);
    }
  }

  async descargarTodo() {
    try {
      const suffix = this.vigenciaNombre ? `-${this.vigenciaNombre.replace(/\s+/g, '-')}` : '';
      await this.descargaService.descargarMultiplesArchivos(
        this.documentos,
        `documentosPAA${suffix}.zip`,
        suffix
      );
    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error);
    }
  }
}
