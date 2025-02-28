import { Component, OnInit } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { FormularioAuditoriaEspecialComponent } from "./formulario-auditoria-especial/formulario-auditoria-especial.component";
import { MatDialog } from "@angular/material/dialog";
import { Auditoria } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { Parametro } from "src/app/shared/data/models/parametros/parametros";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { forkJoin } from "rxjs";
import { RolService } from "src/app/core/services/rol.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-registro-auditorias-especiales",
  templateUrl: "./registro-auditorias-especiales.component.html",
  styleUrls: ["./registro-auditorias-especiales.component.css"],
})
export class RegistroAuditoriasEspecialesComponent implements OnInit {
  dataSource = new MatTableDataSource<Auditoria>([]);
  id: string = "";
  years: Parametro[] = [];
  selectedYearId: number | null = null;
  permiso: boolean = false;
  displayedColumns: string[] = [
    "numero",
    "auditoria",
    "tipoEvaluacion",
    "auditor",
    "cronograma",
    "estado",
  ];

  constructor(
    private alertaService: AlertService,
    private dialog: MatDialog,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    private planAuditoriaMid: PlanAnualAuditoriaMid,
    private parametrosService: ParametrosService,
    private rolService: RolService
  ) {}

  ngOnInit(): void {
    this.cargarAuditorias();
    this.cargarVigencias();
    this.setPermisos();
  }

  setPermisos() {
    this.permiso = this.rolService.permisoCreacion(
      environment.ROLES_CREACION.PROGRAMACION
    );
    if (this.permiso && !this.displayedColumns.includes("acciones")) {
      this.displayedColumns.push("acciones");
    }
  }

  cargarVigencias() {
    this.parametrosService
      .get("parametro?query=TipoParametroId:121&limit=0")
      .subscribe((res) => {
        if (res !== null) {
          this.years = res.Data;
        }
      });
  }

  cargarAuditorias(): void {
    this.planAuditoriaMid
      .get(
        `auditoria?query=activo:true,plan_auditoria_id__isnull:true&limit=0&auditores`
      )
      .subscribe(
        (res) => {
          if (res.Data) {
            const auditorias: Auditoria[] = res.Data.map(
              (item: any, index: number) => ({
                numero: index + 1,
                id: item._id ?? 0,
                auditoria: item.titulo ?? "Sin Título",
                tipoEvaluacion: item.tipo_evaluacion_nombre ?? "Sin Tipo",
                tipoEvaluacionId: item.tipo_evaluacion_id ?? 0,
                auditores: [],
                cronograma: item.cronograma ?? "Sin Cronograma",
                cronogramaId: item.cronograma_id ?? 0,
                estado: item.estado_id ?? "Desconocido",
              })
            );

            const auditorRequests = auditorias.map((auditoria) =>
              this.planAuditoriaMid.get(
                `auditor?query=auditoria_id:${auditoria.id},activo:true`
              )
            );

            forkJoin(auditorRequests).subscribe(
              (auditorResponses) => {
                auditorias.forEach((auditoria, index) => {
                  auditoria.auditores = auditorResponses[index]?.Data ?? [];
                });

                this.dataSource.data = auditorias;
                console.log("Auditorías con Auditores:", auditorias);
              },
              (error) => {
                this.alertaService.showErrorAlert("Error al cargar auditores");
              }
            );
          }
        },
        (error) => {
          console.error("Error al cargar las auditorías:", error);
          this.alertaService.showErrorAlert("Error al cargar las auditorías");
        }
      );
  }

  cargarAuditores(auditorias: any[]): void {
    this.planAnualAuditoriaService.get(`auditor`).subscribe(
      (res) => {
        if (res && res.Data) {
          const auditores = res.Data;

          auditorias.forEach((auditoria) => {
            const auditoresAuditoria = auditores.filter(
              (auditor: any) => auditor.auditoria_id === auditoria.id
            );
            auditoria.auditores = auditoresAuditoria.map((auditor: any) => ({
              auditor_id: auditor.auditor_id,
              auditor_lider: auditor.auditor_lider,
            }));
          });
          console.log("Auditorias con auditores", auditorias);
          this.dataSource.data = auditorias;
        }
      },
      (error) => {
        this.alertaService.showErrorAlert("Error al cargar los auditores");
      }
    );
  }

  nuevaAuditoria() {
    if (this.selectedYearId) {
      const payload = {
        vigencia_id: this.selectedYearId,
        plan_auditoria_id: null,
      };
      this.planAnualAuditoriaService.post("auditoria", payload).subscribe(
        (response: any) => {
          if (response.Status === 201) {
            this.alertaService.showSuccessAlert(
              "Auditoría especial creada exitosamente"
            );
            this.cargarAuditorias();
          }
        },
        (error) => {
          if (
            error.error?.Data &&
            error.error.Data.includes("Ya existe una auditoría")
          ) {
            this.alertaService.showAlert(
              "Vigencia duplicada",
              "Ya existe una auditoría para la vigencia seleccionada."
            );
          } else {
            this.alertaService.showErrorAlert("Error al crear la auditoría");
          }
        }
      );
    } else {
      this.alertaService.showAlert(
        "Selección requerida",
        "Debe seleccionar un año."
      );
    }
  }

  agregarAuditoria(auditoria?: Auditoria) {
    const dialogRef = this.dialog.open(FormularioAuditoriaEspecialComponent, {
      width: "90%",
      autoFocus: false,
      data: {
        auditoria,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        console.log("Auditoría guardada o actualizada");
        this.cargarAuditorias();
      }
    });
  }

  getAuditoresNombres(element: any): string {
    return element.auditores
      .map((auditor: any) => auditor.auditor_nombre)
      .join(", ");
  }

  editarAuditoria(auditoria: Auditoria) {
    this.agregarAuditoria(auditoria);
    console.log("Auditoría actual:", auditoria);
  }
}
