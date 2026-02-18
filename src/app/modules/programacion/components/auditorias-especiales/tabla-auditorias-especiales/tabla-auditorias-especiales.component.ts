import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { AlertService } from 'src/app/shared/services/alert.service';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { Auditoria } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria";
import { FormularioAuditoriaEspecialComponent } from "../formulario-auditoria-especial/formulario-auditoria-especial.component";

@Component({
  selector: 'app-tabla-auditorias-especiales',
  templateUrl: './tabla-auditorias-especiales.component.html',
  styleUrl: './tabla-auditorias-especiales.component.css'
})
export class TablaAuditoriasEspecialesComponent {
  @Input() vigenciaId: number | null = null;
  @Input() permiso: boolean = false;
  @Input() usuarioId: number | null = null;
  @Input() usuarioRol: string = "";
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<Auditoria>([]);
  totalRegistros: number = 0;
  pageSize: number = 5;
  pageIndex: number = 0;
  itemsPerPage: number[] = [5, 10, 20];
  mostrarAcciones: boolean = false;
  displayedColumns: string[] = [
    "numero",
    "auditoria",
    "tipoEvaluacion",
    "auditor",
    "cronograma",
    "estado",
  ];

  constructor(
    private planAuditoriaMid: PlanAnualAuditoriaMid,
    private alertaService: AlertService,
    private dialog: MatDialog,
  ) {}

  cargarAuditorias(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0
  ): void {
  this.vigenciaId = vigenciaId;
  this.planAuditoriaMid
    .get(
      `auditoria?query=vigencia_id:${vigenciaId},activo:true,plan_auditoria_id__isnull:true&limit=${limit}&offset=${offset}&auditores`
    ).subscribe({
      next: (res) => {
        if (res.Data) {
          const auditorias: Auditoria[] = res.Data.map(
            (item: any, index: number) => ({
              numero: index + 1,
              id: item._id ?? 0,
              auditoria: item.titulo ?? "Sin Título",
              tipoEvaluacion: item.tipo_evaluacion_nombre ?? "Sin Asignar",
              tipoEvaluacionId: item.tipo_evaluacion_id ?? 0,
              auditores: [],
              cronograma: item.cronograma ?? "Sin Cronograma",
              cronogramaId: item.cronograma_id ?? 0,
              macroprocesoId: item.macroproceso_id ?? 0,
              procesoId: item.proceso_id ?? 0,
              dependenciaId: item.dependencia_id ?? 0,
              estado: item.estado_nombre ?? "Sin estado",
            })
          );

          const auditorRequests = auditorias.map((auditoria) =>
            this.planAuditoriaMid.get(
              `auditor?query=auditoria_id:${auditoria.id},activo:true`
            )
          );

          forkJoin(auditorRequests).subscribe({
            next: (auditorResponses) => {
              auditorias.forEach((auditoria, index) => {
                auditoria.auditores = auditorResponses[index]?.Data ?? [];
              });

              this.dataSource.data = auditorias;
            },
            error: (error) => {
              this.alertaService.showErrorAlert("Error al cargar auditores");
            }
          });

          this.totalRegistros = res.MetaData.Count;
          if (this.totalRegistros === 0) {
            this.dataSource.data = [];
          }
          if (this.permiso && !this.displayedColumns.includes("acciones")) {
            this.displayedColumns.push("acciones");
          }
        }
      },
      error: (error) => {
        console.error("Error al cargar las auditorías:", error);
        this.alertaService.showErrorAlert("Error al cargar las auditorías");
      }
    });
  }

  editarAuditoria(auditoria?: Auditoria) {
    const dialogRef = this.dialog.open(FormularioAuditoriaEspecialComponent, {
      width: "90%",
      autoFocus: false,
      data: {
        auditoria,
        usuarioRol: this.usuarioRol,
        usuarioId: this.usuarioId
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.cargarAuditorias(this.vigenciaId!);
      }
    });
  }

  enviaraAuditor(auditoria: Auditoria) {
    console.log("Enviar a auditor:", auditoria);
    this.alertaService.showErrorAlert("Funcionalidad en desarrollo");
  }

  getAuditoresNombres(element: any): string {
    return element.auditores
      .map((auditor: any) => auditor.auditor_nombre)
      .join(", ");
  }

  manejarCambioPaginado(evento: PageEvent) {
    // Actualizar el índice de página y tamaño de página
    this.pageSize = evento.pageSize;
    this.pageIndex = evento.pageIndex;

    const offset = this.pageIndex * this.pageSize;
    this.cargarAuditorias(this.vigenciaId!, this.pageSize, offset);
    // Actualizar el paginador después de realizar la consulta
    this.paginator.length = this.totalRegistros;
    this.paginator.pageSize = this.pageSize;
    this.paginator.pageIndex = this.pageIndex;
  }
}
