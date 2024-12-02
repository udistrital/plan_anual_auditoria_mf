import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { ModalService } from "src/app/shared/services/modal.service";
import { UserService } from "src/app/core/services/user.service";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { ImplicitAutenticationService } from "src/app/core/services/implicit_autentication.service";
import { MatTableDataSource } from "@angular/material/table";
import { Parametro } from "src/app/shared/data/models/parametros/parametros";
import { Plan } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria";
import { environment } from "src/environments/environment";

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

  years: Parametro[] = [];
  selectedYearId: number | null = null;

  dataSource = new MatTableDataSource<Plan>([]);
  displayedColumns: string[] = [
    "no",
    "creadoPor",
    "vigencia",
    "fechaCreacion",
    "estado",
    "documentos",
    "acciones",
  ];

  constructor(
    private router: Router,
    private modalService: ModalService,
    public dialog: MatDialog,
    private parametrosService: ParametrosService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    private autenticationService: ImplicitAutenticationService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.buscarRol();
    this.cargarPlanesAuditoria();
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
    });
  }

  buscarRol() {
    this.autenticationService.getRole().then((roles: any) => {
      if (!roles || roles.length === 0) {
        console.error("No roles found for the user");
        return;
      }

      this.IsSecretario = roles.some(
        (role: string) => role === "VICERRECTOR"
      );
      this.IsAuditor = roles.includes("ADMIN_SGA");
      this.IsJefe = roles.includes("JEFE_DEPENDENCIA");

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

  cargarPlanesAuditoria() {
    this.planAnualAuditoriaService.planilla("plan-auditoria").subscribe(
      (res) => {
        if (res && res.Data) {
          this.dataSource.data = res.Data.filter(
            (item: any) => item.activo === true
          ).map((item: any, index: number) => ({
            id: item._id,
            creadoPor: item.creado_por_id ?? "Sin asignar",
            vigencia: item.vigencia_nombre ?? "No encontrada",
            fechaCreacion: item.fecha_creacion ?? "No encontrada",
            estado: item.estado?.estado_nombre ?? "Borrador",
          }));
        }
      },
      (error) => {
        this.modalService.mostrarModal(
          "Error al cargar los planes de auditoría",
          "error",
          "ERROR"
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
                  this.modalService.mostrarModal(
                    "Plan creado exitosamente",
                    "success",
                    "PROCESO COMPLETADO"
                  );
                  this.cargarPlanesAuditoria(); 
                } else {
                  this.modalService.mostrarModal(
                    "Error al asociar el estado al plan",
                    "error",
                    "ERROR"
                  );
                }
              },
              (estadoError) => {
                this.modalService.mostrarModal(
                  "Error al asociar el estado al plan",
                  "error",
                  "ERROR"
                );
                console.error(estadoError);
              }
            );
          } else {
            this.modalService.mostrarModal(
              "Error al crear el plan",
              "error",
              "ERROR"
            );
          }
        },
        (error) => {
          if (
            error.error?.Data &&
            error.error.Data.includes("Ya existe un plan")
          ) {
            this.modalService.mostrarModal(
              "Ya existe un plan de auditoría para la vigencia seleccionada.",
              "warning",
              "VIGENCIA DUPLICADA"
            );
          } else {
            this.modalService.mostrarModal(
              "Error al crear el plan",
              "error",
              "ERROR"
            );
          }
          console.error(error);
        }
      );
    } else {
      this.modalService.mostrarModal(
        "Debe seleccionar un año",
        "warning",
        "SELECCIÓN REQUERIDA"
      );
    }
  }

  editarReporte(element: any) {
    console.log(this.dataSource);
    this.router.navigate([`/programacion/plan-auditoria/editar/`, element.id]);
  }

  editarActividades(element: any) {
    this.router.navigate([
      `/programacion/plan-auditoria/registrar-auditorias/`,
      element.id,
    ]);
  }

  enviarPlan(element: any) {
    this.modalService
      .modalConfirmacion(
        " ",
        "warning",
        "¿Está seguro(a) de enviar el Plan Anual de Auditoría - PAA?"
      )
      .then((result) => {
        if (result.isConfirmed) {

          const nuevoEstado = this.construirEstado(
            element.id,
            environment.PLAN_ESTADO.EN_REVISION_JEFE_ID
          );
  
          this.planAnualAuditoriaService.post("estado", nuevoEstado).subscribe(
            (nuevoEstadoResponse: any) => {
              if (nuevoEstadoResponse.Status === 201) {
                this.modalService.mostrarModal(
                  "Su plan fue enviado exitosamente",
                  "success",
                  "PLAN ENVIADO"
                );
              } else {
                this.modalService.mostrarModal(
                  "Error al asociar el estado al plan",
                  "error",
                  "ERROR"
                );
              }
            },
            (nuevoEstadoError) => {
              this.modalService.mostrarModal(
                "Error al asociar el estado al plan",
                "error",
                "ERROR"
              );
              console.error(nuevoEstadoError);
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
    this.router.navigate(["/programacion/plan-auditoria/revision-jefe", element.id]);
  }

  viewPlanSecretario(element: any) {
    this.router.navigate(["/programacion/plan-auditoria/revision-secretario", element.id]);
  }
}