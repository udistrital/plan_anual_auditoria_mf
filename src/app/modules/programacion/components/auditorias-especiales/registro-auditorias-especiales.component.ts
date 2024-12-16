import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { FormularioAuditoriaEspecialComponent } from "./formulario-auditoria-especial/formulario-auditoria-especial.component";
import { MatDialog } from "@angular/material/dialog";
import { Auditoria } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { Parametro } from "src/app/shared/data/models/parametros/parametros";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { AlertService } from "src/app/shared/services/alert.service";

@Component({
  selector: "app-registro-auditorias-especiales",
  templateUrl: "./registro-auditorias-especiales.component.html",
  styleUrls: ["./registro-auditorias-especiales.component.css"],
})
export class RegistroAuditoriasEspecialesComponent implements OnInit {
  formUsuarios: FormGroup | undefined;
  displayedColumns: string[] = [
    "numero",
    "auditoria",
    "tipoEvaluacion",
    "auditor",
    "cronograma",
    "estado",
    "acciones",
  ];
  dataSource = new MatTableDataSource<Auditoria>([]);
  id: string = "";
  years: Parametro[] = [];
  selectedYearId: number | null = null;

  constructor(
    private alertaService: AlertService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    private parametrosService: ParametrosService
  ) {}

  ngOnInit(): void {
    this.loadAuditoriasFromService();
    this.LoadYears();
  }

  LoadYears() {
    this.parametrosService
      .get("parametro?query=TipoParametroId:121&limit=0")
      .subscribe((res) => {
        if (res !== null) {
          this.years = res.Data;
        }
      });
  }

  loadAuditoriasFromService(): void {
    this.planAnualAuditoriaService.get(`auditoria`).subscribe(
      (res) => {
        if (res && res.Data) {
          const auditorias = res.Data.filter(
            (item: any) => item.activo === true && !item.plan_auditoria_id
          ).map((item: any) => ({
            id: item._id ?? 0,
            auditoria: item.titulo ?? "Sin Título",
            tipoEvaluacion: item.tipo_evaluacion_id ?? "Sin Tipo",
            auditores: [], 
            cronograma: item.cronograma_id ?? "Sin Cronograma",
            estado: item.estado_id ?? "Desconocido",
          }));

          this.loadAuditores(auditorias);
          console.log("Auditorias", auditorias);
        }
      },
      (error) => {
        this.alertaService.showErrorAlert("Error al cargar las auditorías");
      }
    );
  }

  loadAuditores(auditorias: any[]): void {
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
    )
  }

  NewAuditoria() {
    if (this.selectedYearId) {
      this.planAnualAuditoriaService
        .post("auditoria", {
          vigencia_id: this.selectedYearId,
        })
        .subscribe(
          (response: any) => {
            if (response.Status === 201) {
              this.alertaService.showSuccessAlert(
                "Auditoría especial creada exitosamente"
              );
              this.loadAuditoriasFromService();
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

  addAuditoria(auditoria?: Auditoria) {
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
        this.loadAuditoriasFromService();
      }
    });
  }

  editAuditoria(auditoria: Auditoria) {
    this.addAuditoria(auditoria);
    console.log("Auditoría actual:", auditoria);
  }
}
