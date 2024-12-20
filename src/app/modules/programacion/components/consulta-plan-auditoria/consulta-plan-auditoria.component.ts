import { Component, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { ModalService } from "src/app/shared/services/modal.service";
import { UserService } from "src/app/core/services/user.service";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { ImplicitAutenticationService } from "src/app/core/services/implicit_autentication.service";
import { MatTableDataSource } from "@angular/material/table";
import { Parametro } from "src/app/shared/data/models/parametros/parametros";
import { Plan } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria";
import { environment } from "src/environments/environment";
import { AlertService } from "src/app/shared/services/alert.service";
import { MatDialog } from "@angular/material/dialog";
import { ModalListaRechazosComponent } from "./modal-lista-rechazos/modal-lista-rechazos.component";
import { MatPaginator } from "@angular/material/paginator";
import { ModalVerDocumentosPlanComponent } from "./modal-ver-documentos-plan/modal-ver-documentos-plan.component";

@Component({
  selector: "app-consulta-plan-auditoria",
  templateUrl: "./consulta-plan-auditoria.component.html",
  styleUrls: ["./consulta-plan-auditoria.component.css"],
})
export class ConsultaPlanAuditoriaComponent implements OnInit {
  role: string | null = null;
  IsSecretario = false;
  IsAuditor = false;
  IsJefe = false;
  usuarioId: any;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  total!: number;
  opcionesPagina: number[] = [5, 10, 25];
  offset = 0;

  years: Parametro[] = [];
  selectedYearId: number | null = null;

  dataSource = new MatTableDataSource<Plan>([]);
  displayedColumns: string[] = [
    "no",
    "creadoPor",
    "vigencia",
    "fechaCreacion",
    "estado",
    "acciones"
  ];

  constructor(
    private alertaService: AlertService,
    private dialog: MatDialog,
    private router: Router,
    private parametrosService: ParametrosService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    private PlanAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private autenticationService: ImplicitAutenticationService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.buscarRol();
    this.cargarPlanesAuditoria(this.opcionesPagina[0], this.offset);
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
    });
  }

  ngAfterViewInit() {
    this.paginator.page.subscribe(() => {
      const limit = this.paginator.pageSize;
      this.offset = this.paginator.pageIndex * limit;
      this.cargarPlanesAuditoria(limit, this.offset);
    });
  }


  IniciarPaginacion() {
    this.paginator.pageIndex = 0;
    this.paginator.pageSize = this.opcionesPagina[0];
    this.offset = 0;
  }

  buscarRol() {
    this.autenticationService.getRole().then((roles: any) => {
      if (!roles || roles.length === 0) {
        console.error("No roles found for the user");
        return;
      }

      this.IsSecretario = roles.includes("SECRETARIO_AUDITOR");
      this.IsAuditor =roles.some((role: string) => role === "AUDITOR_EXTERNO" ||  role === "AUDITOR");
      this.IsJefe = roles.includes("JEFE_CONTROL_INTERNO");

      this.role = this.IsSecretario
        ? "secretario"
        : this.IsAuditor
        ? "auditor"
        : this.IsJefe
        ? "jefe"
        : null;

      if (this.IsAuditor) {
        this.cargarVigencias();
      }
      console.log(this.role);
    });
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
    this.PlanAnualAuditoriaMid.get(
      `plan-auditoria?query=&limit=${limit}&offset=${offset}`
    ).subscribe(
      (res) => {
        if (res && res.Data) {
          this.dataSource.data = res.Data.filter((item: any) => {
            this.total = res.MetaData.Count;

            if (!this.IsAuditor && item.estado?.estado_id === 6790) {
              return false;
            }
            return item.activo === true;
          }).map((item: any, index: number) => ({
            id: item._id,
            creadoPor: item.creado_por_id ?? "Sin asignar",
            vigencia: item.vigencia_nombre ?? "No encontrada",
            fechaCreacion: item.fecha_creacion ?? "No encontrada",
            estado: item.estado?.estado_nombre ?? "Borrador",
            estadoId: item.estado?.estado_id ?? 6790,
          }));
        }
      },
      (error) => {
        this.alertaService.showErrorAlert(
          "Error al cargar los planes de auditoría"
        );
      }
    );
  }

  crearPlan() {
    if (this.selectedYearId) {
      const Plan: any = {
        vigencia_id: this.selectedYearId,
      };

      this.planAnualAuditoriaService.post("plan-auditoria", Plan).subscribe(
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
                  this.IniciarPaginacion();
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
            this.alertaService.showConfirmAlert(
              "Ya existe un plan de auditoría para la vigencia seleccionada.",
              "VIGENCIA DUPLICADA"
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
    this.alertaService.showConfirmAlert(
        "¿Está seguro(a) de enviar el Plan Anual de Auditoría - PAA?"
    ).then((result) => {
        if (result.isConfirmed) {
            // Verificar si existe el documento con referencia_id
            this.planAnualAuditoriaService.get(`documento?query=referencia_id:${element.id},activo:true`).subscribe(
                (documentos) => {
                    if (documentos && documentos.Data.length > 0) {
                        const nuevoEstado = this.construirEstado(
                            element.id,
                            environment.PLAN_ESTADO.EN_REVISION_JEFE_ID
                        );

                        this.planAnualAuditoriaService.post("estado", nuevoEstado).subscribe(
                            (nuevoEstadoResponse: any) => {
                                if (nuevoEstadoResponse.Status === 201) {
                                    this.alertaService.showSuccessAlert(
                                        "Plan enviado exitosamente"
                                    );
                                    this.IniciarPaginacion();
                                    this.cargarPlanesAuditoria(this.opcionesPagina[0], 0);
                                } else {
                                    this.alertaService.showErrorAlert(
                                        "Error al asociar el estado al plan"
                                    );
                                }
                            },
                            (nuevoEstadoError) => {
                                this.alertaService.showErrorAlert(
                                    "Error al asociar el estado al plan"
                                );
                                console.error(nuevoEstadoError);
                            }
                        );
                    } else {
                        // Si no existe el documento, mostrar alerta
                        this.alertaService.showErrorAlert(
                            "No cuenta con el PDF del Plan Anual de Auditoría creado"
                        );
                    }
                },
                (error) => {
                    this.alertaService.showErrorAlert(
                        "Error al verificar la existencia del documento asociado."
                    );
                    console.error(error);
                }
            );
        }
    });
}


  construirEstado(planId: string, estadoId: number, observacion = "") {
    return {
      plan_auditoria_id: planId,
      usuario_id: this.usuarioId,
      observacion,
      estado_id: estadoId,
    };
  }

  viewPlanJefe(element: any) {
    this.router.navigate([
      "/programacion/plan-auditoria/revision-jefe",
      element.id,
    ]);
  }

  viewPlanSecretario(element: any) {
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

  verificarRechazos(plan: any) {
    const planId = plan.id;
    const estadoRechazadoId = environment.PLAN_ESTADO.RECHAZADO;

    this.planAnualAuditoriaService
      .get(
        `estado?query=plan_auditoria_id:${planId},estado_id:${estadoRechazadoId},activo:true&limit=1&fields=_id`
      )
      .subscribe((res) => {
        if (res.MetaData.Count) {
          plan.tieneRechazos = true;
          plan.numRechazos = res.MetaData.Count;
        }
      });
  }

  verDocumentos(element: any) {
    const dialogRef = this.dialog.open(ModalVerDocumentosPlanComponent, {
      width: "1200px",
      data: {
        planAuditoriaId: element.id,
      },
    });
  }
}
