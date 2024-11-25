import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { FormularioAuditoriaEspecialComponent } from "./formulario-auditoria-especial/formulario-auditoria-especial.component";
import { MatDialog } from "@angular/material/dialog";
import { Auditoria } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { ModalService } from "src/app/shared/services/modal.service";
import { Parametro } from "src/app/shared/data/models/parametros/parametros";
import { ParametrosService } from "src/app/core/services/parametros.service";

@Component({
  selector: "app-auditorias-especiales",
  templateUrl: "./auditorias-especiales.component.html",
  styleUrls: ["./auditorias-especiales.component.css"],
})
export class AuditoriasEspecialesComponent implements OnInit {
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
    private modalService: ModalService,
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
    this.planAnualAuditoriaService.get(`/auditoria`).subscribe(
      (res) => {
        if (res && res.Data) {
          this.dataSource.data = res.Data.filter(
            (item: any) => item.activo === true
          ).map((item: any) => ({
            id: item._id ?? 0,
            auditoria: item.titulo ?? "Sin Título",
            tipoEvaluacion: item.tipo_evaluacion_id ?? "Sin Tipo",
            auditor: item.auditor_id ?? "Sin Auditor",
            cronograma: item.cronograma_id ?? "Sin Cronograma",
            estado: item.estado_id ?? "Desconocido",
          }));
        }
      },
      (error) => {
        this.modalService.mostrarModal(
          "Error al cargar las auditorías",
          "error",
          "ERROR"
        );
      }
    );
  }

  NewAuditoria() {
    if (this.selectedYearId) {
      this.planAnualAuditoriaService
        .post("/auditoria", {
          vigencia_id: this.selectedYearId,
        })
        .subscribe(
          (response: any) => {
            if (response.Status === 201) {
              this.modalService.mostrarModal(
                "Auditoría especial creada exitosamente",
                "success",
                "AUDITORIA CREADA"
              );
              this.loadAuditoriasFromService();
            }
          },
          (error) => {
            if (
              error.error?.Data &&
              error.error.Data.includes("Ya existe una auditoría")
            ) {
              this.modalService.mostrarModal(
                "Ya existe una auditoría para la vigencia seleccionada.",
                "warning",
                "VIGENCIA DUPLICADA"
              );
            } else {
              this.modalService.mostrarModal(
                "Error al crear la auditoría",
                "error",
                "ERROR"
              );
            }
          }
        );
    } else {
      this.modalService.mostrarModal(
        "Debe seleccionar un año.",
        "warning",
        "SELECCIÓN REQUERIDA"
      );
    }
  }

  addAuditoria(auditoria?: Auditoria) {
    const dialogRef = this.dialog.open(FormularioAuditoriaEspecialComponent, {
      width: "1100px",
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
