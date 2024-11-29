import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { ImplicitAutenticationService } from "src/app/core/services/implicit_autentication.service";
import { MatTableDataSource } from "@angular/material/table";
import { Parametro } from "src/app/shared/data/models/parametros/parametros";
import { Plan } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria";
import { AlertService } from "src/app/shared/services/alert.service";

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
    private alertaService: AlertService,
    private router: Router,
    public dialog: MatDialog,
    private parametrosService: ParametrosService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    private autenticationService: ImplicitAutenticationService
  ) {}

  ngOnInit(): void {
    this.buscarRole();
    this.cargarPlanesAuditoria();
  }

  buscarRole() {
    this.autenticationService.getRole().then((roles: any) => {
      if (!roles || roles.length === 0) {
        console.error("No roles found for the user");
        return;
      }

      this.IsSecretario = roles.some((role: string) => role === "VICERRECTOR");
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
            estado: item.estado ?? "Borrador",
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
          if (response.Status === 201) {
            this.alertaService.showSuccessAlert("Plan creado exitosamente");
            this.cargarPlanesAuditoria();
          }
        },
        (error) => {
          // Verificar si el error es por duplicidad de vigenciaId
          if (
            error.error?.Data &&
            error.error.Data.includes("Ya existe un plan")
          ) {
            this.alertaService.showAlert(
              "Vigencia duplicada",
              "Ya existe un plan de auditoría para la vigencia seleccionada."
            );
          } else {
            this.alertaService.showErrorAlert("Error al crear el plan");
          }
        }
      );
    } else {
      this.alertaService.showAlert(
        "Selección requerida",
        "Debe seleccionar un año"
      );
    }
  }

  editReport(element: any) {
    console.log(this.dataSource);
    this.router.navigate([`/programacion/plan-auditoria/editar/`, element.id]);
  }

  editActivities(element: any) {
    this.router.navigate([
      `/programacion/plan-auditoria/registrar-auditorias/`,
      element.id,
    ]);
  }

  sendApproval(element: any) {
    this.alertaService
      .showConfirmAlert(
        "¿Está seguro(a) de enviar el Plan Anual de Auditoría - PAA?"
      )
      .then((result) => {
        if (result.isConfirmed) {
          console.log("Plan enviado");
          this.alertaService.showSuccessAlert(
            "Su plan fue enviado al jefe de oficina"
          );
        }
      });
  }

  viewPlanJefe() {
    this.router.navigate(["/programacion/revision-jefe"]);
  }

  viewPlanSecretario() {
    this.router.navigate(["/programacion/plan-auditoria/revision-secretario"]);
  }
}
