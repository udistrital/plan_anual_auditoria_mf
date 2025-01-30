import { ChangeDetectorRef, Component, Input, ViewChild } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { Router } from "@angular/router";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { Auditoria } from "src/app/shared/data/models/auditoria-auditor";
import { AlertService } from "src/app/shared/services/alert.service";
import { colocacionesContructorTabla } from "./tabla-consulta-auditorias.utilidades";
import { MatSort } from "@angular/material/sort";
import { ModalAgregarAuditorComponent } from "../modal-agregar-auditor/modal-agregar-auditor.component";
import { forkJoin } from "rxjs";
import { ImplicitAutenticationService } from "src/app/core/services/implicit_autentication.service";

@Component({
  selector: "app-tabla-consulta-auditorias",
  templateUrl: "./tabla-consulta-auditorias.component.html",
  styleUrl: "./tabla-consulta-auditorias.component.css",
})
export class TablaConsultaAuditoriasComponent {
  @Input() vigenciaId: any;
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
  permisoEdicion: boolean = false;
  permisoConsulta: boolean = false;

  constructor(
    private readonly alertaService: AlertService,
    private readonly autenticacionService: ImplicitAutenticationService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly dialog: MatDialog,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.autenticacionService
      .getRole()
      .then((roles) => {
        this.permisoEdicion = this.autenticacionService.PermisoEdicion(
          roles as string[]
        );
        console.log("Permiso de edición:", this.permisoEdicion);
        this.permisoConsulta = this.autenticacionService.PermisoConsulta(
          roles as string[]
        );
        console.log("Permiso de consulta:", this.permisoConsulta);
      })
      .catch((error) => {
        console.error("Error al obtener los roles del usuario:", error);
      });
  }

  listarAuditoriasPorVigencia(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0
  ): void {
    this.auditoriasPorVigencia = [];

    const auditorias$ = this.planAuditoriaMid.get(
      `auditoria?query=vigencia_id:${vigenciaId},activo:true&limit=${limit}&offset=${offset}&auditores`
    );

    auditorias$.subscribe((res) => {
      const auditorias: Auditoria[] = Array.isArray(res.Data) ? res.Data : [];
      console.log("Consulta aud Mid: ", auditorias);
  
      if (auditorias.length === 0) {
        this.banderaTablaAuditoriasInternas = false;
        this.auditoriasDataSource.data = [];
        this.alertaService.showAlert(
          "No hay auditorías registradas",
          "Actualmente no hay auditorías registradas para la vigencia seleccionada."
        );
        return;
      }
  
      auditorias.forEach((auditoria) => {
        auditoria.auditores = Array.isArray(auditoria.auditores)
          ? auditoria.auditores
          : [];
      });

      this.auditoriasPorVigencia = auditorias;
      this.totalRegistros = res.MetaData?.Count ?? 0;
      this.banderaTablaAuditoriasInternas = true;
      this.construirTabla();
    }, 
    (error) => {
      console.error("Error al cargar auditorías:", error);
      this.alertaService.showErrorAlert("Error al cargar las auditorías.");
    });
  }

  construirTabla() {
    this.auditoriasContructorTabla = colocacionesContructorTabla.filter(
      (column) => {
        return column.columnDef !== "acciones" || this.permisoEdicion;
      }
    );

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

  agregarAuditor(auditoria?: Auditoria) {
    console.log("Row: ", auditoria);
    const dialogRef = this.dialog.open(ModalAgregarAuditorComponent, {
      width: "1100px",
      data: {
        auditoria,
      },
    });
  }
}
