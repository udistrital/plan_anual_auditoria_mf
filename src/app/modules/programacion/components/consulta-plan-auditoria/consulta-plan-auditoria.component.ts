import { Component, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { UserService } from "src/app/core/services/user.service";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { MatTableDataSource } from "@angular/material/table";
import { Parametro } from "src/app/shared/data/models/parametros/parametros";
import { Plan } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria";
import { environment } from "src/environments/environment";
import { AlertService } from "src/app/shared/services/alert.service";
import { MatDialog } from "@angular/material/dialog";
import { ModalListaRechazosComponent } from "./modal-lista-rechazos/modal-lista-rechazos.component";
import { MatPaginator } from "@angular/material/paginator";
import { ModalVerDocumentosComponent } from "src/app/shared/elements/components/dialogs/modal-ver-documentos/modal-ver-documentos.component";
import { RolService } from "src/app/core/services/rol.service";
import { accionesProgramacion } from "src/app/shared/utils/accionesPorRolYEstado";
import { catchError, exhaustMap, Observable, of, throwError } from "rxjs";
import rolRemitentePorRol from "src/app/shared/utils/rolRemitentePorRol";
import { TercerosService } from "src/app/shared/services/terceros.service";
import {
  NotificacionesService,
  DestinatariosEmail,
  VariablesSolicitud,
} from "src/app/shared/services/notificaciones.service";

@Component({
  selector: "app-consulta-plan-auditoria",
  templateUrl: "./consulta-plan-auditoria.component.html",
  styleUrls: ["./consulta-plan-auditoria.component.css"],
})
export class ConsultaPlanAuditoriaComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  total!: number;
  opcionesPagina: number[] = [5, 10, 25];
  offset = 0;
  roles: string[] = [];
  usuarioId: any;
  years: Parametro[] = [];
  selectedYearId: number | null = null;
  dataSource = new MatTableDataSource<Plan>([]);
  permisoCreacion: boolean = false;
  displayedColumns: string[] = [
    "no",
    "creadoPor",
    "vigencia",
    "fechaCreacion",
    "estado",
  ];
  iconosAccion = new Map<string, string>([
    ["Ver", "visibility"],
    ["Ver Plan", "visibility"],
    ["Ver Auditorias", "visibility"],
    ["Ver Documentos", "visibility"],
    ["Editar", "edit"],
    ["Registrar Auditorías", "add_circle"],
    ["Historial de Rechazo", "report"],
    ["Enviar Aprobación", "send"],
  ]);

  constructor(
    private readonly alertaService: AlertService,
    private readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly parametrosService: ParametrosService,
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService,
    private readonly PlanAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private rolService: RolService,
    private readonly userService: UserService,
    private readonly notificacionesService: NotificacionesService,
    private readonly tercerosService: TercerosService,
  ) {}

  ngOnInit(): void {
    this.roles = this.rolService.getRoles();
    this.setPermisos();
    this.cargarPlanesAuditoria(this.opcionesPagina[0], this.offset);
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
    });
  }

  setPermisos() {
    this.permisoCreacion = this.rolService.permisoCreacion(
      environment.ROLES_CREACION.PROGRAMACION
    );
    if (this.rolService.mostrarAcciones(accionesProgramacion)) {
      this.displayedColumns.push("acciones");
    }
    if (this.permisoCreacion) this.cargarVigencias();
  }

  ngAfterViewInit() {
    this.paginator.page.subscribe(() => {
      const limit = this.paginator.pageSize;
      this.offset = this.paginator.pageIndex * limit;
      this.cargarPlanesAuditoria(limit, this.offset);
    });
  }

  iniciarPaginacion() {
    this.paginator.pageIndex = 0;
    this.paginator.pageSize = this.opcionesPagina[0];
    this.offset = 0;
  }

  construirEstado(planId: string, estadoId: number, observacion = "") {
    return {
      plan_auditoria_id: planId,
      usuario_id: this.usuarioId,
      observacion,
      estado_id: estadoId,
    };
  }

  cargarVigencias() {
    this.parametrosService
      .get(
        "parametro?query=TipoParametroId:121&fields=Id,Nombre&limit=0&sortby=nombre&order=desc"
      )
      .subscribe((res) => {
        if (res !== null) {
          this.years = res.Data;
        } else {
          console.warn("vigencias no encontradas");
        }
      });
  }

  cargarPlanesAuditoria(limit: number, offset: number) {
    const EN_BORRADOR_ID = environment.PLAN_ESTADO.EN_BORRADOR_ID;
    this.PlanAnualAuditoriaMid.get(
      `plan-auditoria?query=&limit=${limit}&offset=${offset}`
    ).subscribe(
      (res) => {
        if (!res?.Data) return;
        this.total = res.MetaData?.Count;
        this.dataSource.data = res.Data.filter(
          (item: any) => item.activo
          // && (this.rolCreacion() || item.estado?.estado_id !== EN_BORRADOR_ID)  ToDo
        ).map((item: any) => {
          const estadoId = item.estado?.estado_id;
          let acciones = this.getAccionesPorRolYEstado(estadoId);
          if (!item.tiene_rechazos) {
            acciones = acciones.filter(
              (accion) => accion !== "Historial de Rechazo"
            );
          }
          return {
            id: item._id,
            creadoPor: item.creado_por_nombre ?? "Sin asignar",
            vigencia: item.vigencia_nombre ?? "No encontrada",
            fechaCreacion: item.fecha_creacion ?? "No encontrada",
            estado: item.estado?.estado_nombre ?? "Borrador",
            estadoId,
            acciones,
          };
        });
      },
      (error: any) => {
        console.error("Error al cargar los planes de auditoría:", error);
        this.alertaService.showErrorAlert(
          "Error al cargar los planes de auditoría"
        );
      }
    );
  }

  crearPlan() {
    if (this.selectedYearId) {
      const plan: any = {
        vigencia_id: this.selectedYearId,
        creado_por_id: this.usuarioId,
      };
      this.planAnualAuditoriaService.post("plan-auditoria", plan).subscribe(
        (response: any) => {
          if (response.Status === 201 && response.Data) {
            const planAuditoriaId = response.Data._id;

            const estadoBody = this.construirEstado(
              planAuditoriaId,
              environment.PLAN_ESTADO.EN_BORRADOR_ID
            );

            this.planAnualAuditoriaService.post("estado", estadoBody).subscribe(
              (estadoResponse: any) => {
                if (estadoResponse.Status === 201) {
                  this.alertaService.showSuccessAlert(
                    "Plan creado exitosamente"
                  );
                  this.iniciarPaginacion();
                  this.cargarPlanesAuditoria(this.opcionesPagina[0], 0);
                } else {
                  this.alertaService.showErrorAlert(
                    "Error al asociar el estado al plan"
                  );
                }
              },
              (estadoError) => {
                this.alertaService.showErrorAlert(
                  "Error al asociar el estado al plan"
                );
                console.error(estadoError);
              }
            );
          } else {
            this.alertaService.showErrorAlert("Error al crear el plan");
          }
        },
        (error) => {
          if (
            error.error?.Data &&
            error.error.Data.includes("Ya existe un plan")
          ) {
            this.alertaService.showAlert(
              "VIGENCIA DUPLICADA",
              "Ya existe un plan de auditoría para la vigencia seleccionada."
            );
          } else {
            this.alertaService.showErrorAlert("Error al crear el plan");
          }
          console.error(error);
        }
      );
    } else {
      this.alertaService.showAlert(
        "Selección requerida",
        "Debe seleccionar un año"
      );
    }
  }

  // Usar un conjunto para evitar duplicados en las acciones
  getAccionesPorRolYEstado(estado: number) {
    return Array.from(
      new Set(
        this.roles.flatMap((rol) => accionesProgramacion[rol]?.[estado] || [])
      )
    );
  }

  // Obtener el icono dependiendo de la acción
  getIconoAccion(accion: string): string {
    return this.iconosAccion.get(accion) ?? "help";
  }

  // Acciones
  realizarAccion(plan: any, accion: string) {
    const acciones: Record<string, Function | null> = {
      Ver: () => this.verReporte(plan),
      "Ver Plan": () => this.verPlanPorRol(plan),
      "Ver Auditorias": () => this.editarActividades(plan),
      "Registrar Auditorías": () => this.editarActividades(plan),
      "Ver Documentos": () => this.verDocumentos(plan),
      Editar: () => this.editarReporte(plan),
      "Historial de Rechazo": () => this.verMotivosRechazo(plan),
      "Enviar Aprobación": () => this.enviarPlan(plan),
    };
    acciones[accion]?.();
  }

  editarReporte(element: any) {
    this.router.navigate([`/programacion/plan-auditoria/editar/`, element.id]);
  }

  verReporte(element: any) {
    this.router.navigate([`/programacion/plan-auditoria/ver/`, element.id]);
  }

  editarActividades(element: any) {
    this.router.navigate([
      `/programacion/plan-auditoria/registrar-auditorias/`,
      element.id,
    ]);
  }

  enviarPlan(element: any) {
    this.alertaService
      .showConfirmAlert(
        "¿Está seguro(a) de enviar el Plan Anual de Auditoría - PAA?"
      )
      .then((result) => {
        if (result.isConfirmed) {
          // Verificar si existe el documento con referencia_id
          this.planAnualAuditoriaService
            .get(
              `documento?query=referencia_id:${element.id},tipo_id:6810,activo:true`
            )
            .subscribe({
              next: (documentos) => {
                if (documentos && documentos.Data.length > 0) {
                  const nuevoEstado = this.construirEstado(
                    element.id,
                    environment.PLAN_ESTADO.EN_REVISION_JEFE_ID
                  );

                  this.planAnualAuditoriaService
                    .post("estado", nuevoEstado)
                    .subscribe({
                      next: (nuevoEstadoResponse: any) => {
                        if (nuevoEstadoResponse.Status === 201) {
                          this.notificarEnvioPlan(element).pipe(

                            exhaustMap((response: any) => {
                              if (response.Status == 200) {
                                this.alertaService.showSuccessAlert(
                                  "Plan enviado exitosamente"
                                );
                                return of(response);
                              }                               

                              console.error("Solicitud de notificación fallida:", response);
                              return throwError(() => new Error("Solicitud de notificación fallida"));
                            }),

                            catchError((error) => {
                              this.alertaService.showAlert(
                                "Error en notificación",
                                "El plan fue asociado exitosamente, pero hubo un problema al enviar la notificación."
                              );

                              return throwError(() => new Error("Error en notificación", error));
                            }),

                          ).subscribe();
                          this.iniciarPaginacion();
                          this.cargarPlanesAuditoria(this.opcionesPagina[0], 0);
                        } else {
                          this.alertaService.showErrorAlert(
                            "Error al asociar el estado al plan"
                          );
                        }
                      },
                      error: (nuevoEstadoError) => {
                        this.alertaService.showErrorAlert(
                          "Error al asociar el estado al plan"
                        );
                        console.error(nuevoEstadoError);
                      }
                    });
                } else {
                  // Si no existe el documento, mostrar alerta
                  this.alertaService.showErrorAlert(
                    "No cuenta con el PDF del Plan Anual de Auditoría creado"
                  );
                }
              },
              error: (error) => {
                this.alertaService.showErrorAlert(
                  "Error al verificar la existencia del documento asociado."
                );
                console.error(error);
              }
            });
        }
      });
  }

  /**
   * Sends an email notification upon sending the audit plan for approval.
   * @param element The audit plan element containing details such as vigencia.
   * @returns An observable representing the notification sending process.
   */
  notificarEnvioPlan(element: any): Observable<any> {
    return this.tercerosService.getAuthenticatedUserTerceroIdentification().pipe(

      // Fetch the full name of the sender
      exhaustMap((terceroIdentification) => of(terceroIdentification.NombreCompleto)),

      // Send notification using the sender's name
      exhaustMap((nombreRemitente) => {
        const rolRemitente = rolRemitentePorRol[this.roles[0]] || "Usuario";
        const destinatarios: DestinatariosEmail = environment["NOTIFICACION_PLAN_AUDITORIA_DESTINATARIOS"];
        const variablesSolicitud: VariablesSolicitud = {
          titulo_solicitud: "Aprobación de Plan Anual de Auditoría",
          tipo_solicitud: "revisión y aprobación",
          nombre_documento: "Plan Anual de Auditoría",
          vigencia: element.vigencia,
          rol_remitente: rolRemitente,
          nombre_remitente: nombreRemitente || rolRemitente,
          fecha_envio: new Date().toLocaleDateString()
        };

        console.debug("Sending email notification:", {
              "element": element,
              "destinatarios": destinatarios,
              "variablesSolicitud": variablesSolicitud
            });
        return this.notificacionesService.enviarNotificacionSolicitud(destinatarios, variablesSolicitud);
      }),

      catchError((error) => {
        return throwError(() => new Error("Error sending notification", error));
      })
    );
  }

  private verPlanPorRol(plan: any) {
    const esSecretario = this.roles.includes("SECRETARIO_AUDITOR");
    const esJefe = this.roles.includes("JEFE_CONTROL_INTERNO");
    if (esSecretario && esJefe) {
      if (plan.estadoId === environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID) {
        this.verPlanSecretario(plan);
      } else {
        this.verPlanJefe(plan);
      }
    } else if (esSecretario) {
      this.verPlanSecretario(plan);
    } else if (esJefe) {
      this.verPlanJefe(plan);
    }
  }

  verPlanJefe(element: any) {
    this.router.navigate([
      "/programacion/plan-auditoria/revision-jefe",
      element.id,
    ]);
  }

  verPlanSecretario(element: any) {
    this.router.navigate([
      "/programacion/plan-auditoria/revision-secretario",
      element.id,
    ]);
  }

  verMotivosRechazo(plan: any) {
    const dialogRef = this.dialog.open(ModalListaRechazosComponent, {
      width: "1000px",
      data: plan,
      autoFocus: false,
    });
  }

  verDocumentos(element: any) {
    this.dialog.open(ModalVerDocumentosComponent, {
      width: "1200px",
      data: {
        entityId: element.id,
      },
    });
  }
}
