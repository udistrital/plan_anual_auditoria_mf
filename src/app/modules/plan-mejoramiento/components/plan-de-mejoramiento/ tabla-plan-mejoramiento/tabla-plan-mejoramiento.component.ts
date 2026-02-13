import { ChangeDetectorRef, Component, Input, ViewChild } from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { planMejoramientoConstructorTabla } from "./tabla-plan-mejoramiento.utilidades";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";

@Component({
  selector: "app-tabla-plan-mejoramiento",
  templateUrl: "./tabla-plan-mejoramiento.component.html",
  styleUrls: ["./tabla-plan-mejoramiento.component.css"],
})
export class TablaPlanMejoramientoComponent {
  @Input() vigenciaId: any;
  @Input() tipoEvaluacionId: any;
  @Input() role: any;
  @ViewChild(MatSort) sort!: MatSort;

  planesPorVigencia: any[] = [];
  planesDataSource: MatTableDataSource<any> = new MatTableDataSource();
  planesConstructorTabla: any;
  banderaTablePlanes: boolean = false;
  tablaColumnas: any;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  totalRegistros: number = 0;
  pageSize: number = 5;
  pageIndex: number = 0;
  itemsPerPage: number[] = [5, 10, 20];

  constructor(
    private alertaService: AlertService,
    private changeDetector: ChangeDetectorRef,
    private dialog: MatDialog,
    private planAuditoriaMid: PlanAnualAuditoriaMid,
    private router: Router
  ) {}

  listarPlanesPorFiltros(
    vigenciaId: number,
    tipoEvaluacionId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0
  ) {
    console.log("Consultando auditorías - Rol:", this.role, "| Vigencia:", vigenciaId, "| Tipo:", tipoEvaluacionId);
    
    const estadoAprobadoInformeFinal = environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_INFORME_FINAL_JEFE;
    
    this.planesPorVigencia = [];

    this.planAuditoriaMid
      .get(`auditoria?query=vigencia_id:${vigenciaId},tipo_evaluacion_id:${tipoEvaluacionId},estado_id:${estadoAprobadoInformeFinal},activo:true&limit=${limit}&offset=${offset}`)
      .subscribe({
        next: (res) => {
          const auditorias: any[] = res.Data;
          
          // Verificar si hay datos
          if (!auditorias || auditorias.length === 0) {
            Swal.fire({
              title: "No hay planes registrados",
              text: `No se encontraron auditorías en estado "Aprobado informe final" para la vigencia y tipo de evaluación seleccionados.`,
              icon: "info",
            });
            this.planesPorVigencia = [];
            this.totalRegistros = 0;
            this.banderaTablePlanes = false;
            this.planesDataSource.data = [];
            if (this.paginator) {
              this.paginator.length = 0;
            }
            return;
          }
          
          // Asignar datos y construir tabla
          this.planesPorVigencia = auditorias;
          this.totalRegistros = res.MetaData.Count;
          this.banderaTablePlanes = true;
          this.construirTabla();
        },
        error: (error) => {
          console.error('Error al consultar auditorías:', error);
          Swal.fire({
            title: "Error",
            text: "Ocurrió un error al consultar las auditorías. Por favor, intente nuevamente.",
            icon: "error",
          });
          this.planesPorVigencia = [];
          this.totalRegistros = 0;
          this.banderaTablePlanes = false;
          this.planesDataSource.data = [];
          if (this.paginator) {
            this.paginator.length = 0;
          }
        }
      });
  }

  construirTabla() {
    this.planesConstructorTabla = planMejoramientoConstructorTabla;
    this.tablaColumnas = this.planesConstructorTabla.map((column: any) => column.columnDef);
    this.planesDataSource = new MatTableDataSource(this.planesPorVigencia);

    if (this.paginator) {
      this.planesDataSource.paginator = this.paginator;
      this.paginator.length = this.totalRegistros;
      this.paginator.pageSize = this.pageSize;
      this.paginator.pageIndex = this.pageIndex;
    }
    if (this.sort) {
      this.planesDataSource.sort = this.sort;
    }
    this.changeDetector.detectChanges();
  }

  manejarCambioPaginado(evento: PageEvent) {
    this.pageSize = evento.pageSize;
    this.pageIndex = evento.pageIndex;
    const offset = this.pageIndex * this.pageSize;
    this.listarPlanesPorFiltros(this.vigenciaId, this.tipoEvaluacionId, this.pageSize, offset);
  }

  registrarPlan(plan: any) {
    this.router.navigate([`/planes/plan-mejoramiento/registrar-plan/${plan._id}`]);
  }

  enviarAprobacion(plan: any) {
    this.alertaService
      .showConfirmAlert("¿Está seguro de enviar el plan de mejoramiento para aprobación?")
      .then((confirmado) => {
        if (!confirmado.value) return;
        console.log("Enviar aprobación plan:", plan);
        this.alertaService.showSuccessAlert("Plan enviado exitosamente", "ENVIADO PARA APROBACIÓN");
      });
  }

  verDocumentosAuditoria(plan: any) {
    console.log("Ver documentos de auditoría:", plan);
  }
}