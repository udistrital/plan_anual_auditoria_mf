import { ChangeDetectorRef, Component, Input, ViewChild } from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { colocacionesContructorTabla } from "./tabla-auditorias-internas.utilidades";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { MatDialog } from "@angular/material/dialog";
import { ModalVerDocumentoComponent } from "src/app/shared/elements/components/dialogs/modal-ver-documento/modal-ver-documento.component";

import { Router } from "@angular/router";
import { Auditoria } from "src/app/shared/data/models/auditoria";
import { AlertService } from "src/app/shared/services/alert.service";

@Component({
  selector: "app-tabla-auditorias-internas",
  templateUrl: "./tabla-auditorias-internas.component.html",
  styleUrls: ["./tabla-auditorias-internas.component.css"],
})
export class TablaAuditoriasInternasComponent {
  @Input() vigenciaId: any;
  @Input() role: any;
  @Input() personaId: any;
  @ViewChild(MatSort) sort!: MatSort;

  auditoriasPorVigencia: Auditoria[] = [];
  auditoriasDataSource: MatTableDataSource<any> = new MatTableDataSource();
  auditoriasContructorTabla: any;
  banderaTablaAuditoriasInternas: boolean = false;
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
  ) { }

  listarAuditoriasPorVigencia(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0
  ) {
    console.log(this.role)
    this.auditoriasPorVigencia = [];
    
    const endpoint = this.role === 'auditor' && this.personaId
      ? `auditoria/auditor/${this.personaId}?query=vigencia_id:${vigenciaId},activo:true&limit=${limit}&offset=${offset}`
      : `auditoria?query=vigencia_id:${vigenciaId},activo:true&limit=${limit}&offset=${offset}`;

    this.planAuditoriaMid
      .get(endpoint)
      .subscribe((res) => {
        const auditorias: any[] = res.Data;

        if (!(auditorias.length > 0)) {
          this.banderaTablaAuditoriasInternas = false;
          this.auditoriasDataSource.data = [];
          return this.alertaService.showAlert(
            "No hay auditorías registradas",
            "Actualmente no hay auditorías registradas para la vigencia seleccionada."
          );
        }

        this.auditoriasPorVigencia = auditorias;
        this.totalRegistros = res.MetaData.Count;
        this.banderaTablaAuditoriasInternas = true;
        this.construirTabla();
      });
  }

  construirTabla() {
    this.auditoriasContructorTabla = colocacionesContructorTabla;
    this.tablaColumnas = this.auditoriasContructorTabla.map(
      (column: any) => column.columnDef
    );

    this.auditoriasDataSource = new MatTableDataSource(
      this.auditoriasPorVigencia
    );

    //si no hay paginador, se crea
    if (!this.paginator) {
      this.auditoriasDataSource.paginator = this.paginator;
      this.auditoriasDataSource.sort = this.sort;
    }

    this.changeDetector.detectChanges();
  }

  manejarCambioPaginado(evento: PageEvent) {
    // Actualizar el índice de página y tamaño de página
    this.pageSize = evento.pageSize;
    this.pageIndex = evento.pageIndex;

    const offset = this.pageIndex * this.pageSize;
    this.listarAuditoriasPorVigencia(this.vigenciaId, this.pageSize, offset);
    // Actualizar el paginador después de realizar la consulta
    this.paginator.length = this.totalRegistros;
    this.paginator.pageSize = this.pageSize;
    this.paginator.pageIndex = this.pageIndex;
  }

  verDocumento(auditoria: Auditoria) {
    console.log("documento")
  }

  editarInforme(auditoria: Auditoria) {
    const auditoriaId = auditoria._id;
    this.router.navigate([
      `/ejecucion/auditorias-internas/editar-informe/${auditoriaId}`,
    ]);
  }
}
