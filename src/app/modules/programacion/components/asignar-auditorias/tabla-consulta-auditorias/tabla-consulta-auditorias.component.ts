import { Component, Input, ViewChild } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { Auditoria } from "src/app/shared/data/models/auditoria-auditor";
import { AlertService } from "src/app/shared/services/alert.service";
import { colocacionesContructorTabla } from "./tabla-consulta-auditorias.utilidades";
import { MatSort } from "@angular/material/sort";
import { ModalAgregarAuditorComponent } from "../modal-agregar-auditor/modal-agregar-auditor.component";
import { RolService } from "src/app/core/services/rol.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-tabla-consulta-auditorias",
  templateUrl: "./tabla-consulta-auditorias.component.html",
  styleUrl: "./tabla-consulta-auditorias.component.css",
})
export class TablaConsultaAuditoriasComponent {
  @Input() vigenciaId: any;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  auditoriasPorVigencia: Auditoria[] = [];
  auditoriasDataSource: MatTableDataSource<Auditoria> = new MatTableDataSource<Auditoria>([]);
  auditoriasContructorTabla: any;
  tablaColumnas: any;
  totalRegistros: number = 0;
  pageSize: number = 5;
  pageIndex: number = 0;
  itemsPerPage: number[] = [5, 10, 20];
  permiso: boolean = false;
  usuarioRol: string = "";
  planAuditoriaId: string = "";
  banderaTabla: boolean = false;

  constructor(
    private readonly alertaService: AlertService,
    private readonly dialog: MatDialog,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly rolService: RolService
  ) {}

  ngOnInit() {
    this.setPermisos();
    this.construirTabla();
  }

  setPermisos() {
    this.permiso = this.rolService.permisoCreacion(
      environment.ROLES_CREACION.PROGRAMACION
    );
  }

  private verificarPAAAprobado(vigenciaId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.planAuditoriaMid
        .get(
          `plan-auditoria?query=vigencia_id:${vigenciaId},activo:true`
        )
        .subscribe({
          next: (res) => {
            const plan_estado = res.Data[0]?.estado.estado_id;
            const tienePAAAprobado = plan_estado === environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID;
            this.planAuditoriaId = tienePAAAprobado ? res.Data[0]?._id : "";
            resolve(tienePAAAprobado);
          },
          error: (error) => {
            console.error("Error al verificar PAA aprobado:", error);
            reject(error);
          }
        });
    });
  }

  listarAuditoriasPorVigencia(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0
  ): void {
    this.auditoriasPorVigencia = [];
    this.auditoriasDataSource.data = [];
    this.banderaTabla = false;

    // Primero verificar si hay PAAs aprobados
    this.verificarPAAAprobado(vigenciaId)
      .then((tienePAAAprobado) => {
        if (!tienePAAAprobado) {
          // No hay PAA aprobado, mostrar modal
          this.alertaService.showAlert(
            "Sin plan de auditorias aprobado",
            "No se ha encontrado un plan de auditorías aprobado para la vigencia seleccionada."
          );
          return;
        }

        // Si hay PAA aprobado, consultar auditorías que NO estén en borrador
        const auditorias$ = this.planAuditoriaMid.get(
          `auditoria?query=activo:true,plan_auditoria_id:${this.planAuditoriaId},` +
          `estado_id__ne:${environment.AUDITORIA_ESTADO.PROGRAMACION.BORRADOR_ID}&` +
          `limit=${limit}&offset=${offset}&auditores`
        );

        auditorias$.subscribe({
          next: (res) => {
            const auditorias: Auditoria[] = Array.isArray(res.Data)
              ? res.Data
              : [];

            if (auditorias.length === 0) {
              // Hay PAA aprobado pero no hay auditorías en estado válido
              this.alertaService.showAlert(
                "Sin auditorias por asignar",
                "No se han encontrado auditorías para asignación de auditores en la vigencia seleccionada."
              );
              return;
            }

            // Procesar auditorías
            auditorias.forEach((auditoria) => {
              auditoria.auditores = Array.isArray(auditoria.auditores)
                ? auditoria.auditores
                : [];
            });

            this.auditoriasPorVigencia = auditorias;
            this.totalRegistros = res.MetaData.Count;
            this.auditoriasDataSource.data = this.auditoriasPorVigencia;
            this.banderaTabla = true;
          },
          error: (error) => {
            console.error("Error al cargar auditorías:", error);
            this.alertaService.showErrorAlert("Error al cargar las auditorías.");
          }
        });
      })
      .catch((error) => {
        console.error("Error al verificar PAA:", error);
        this.alertaService.showErrorAlert(
          "Error al verificar el Plan Anual de Auditoría."
        );
      });
  }

  construirTabla() {
    this.auditoriasContructorTabla = colocacionesContructorTabla.filter(
      (column) => {
        return column.columnDef !== "acciones" || this.permiso;
      }
    );

    this.tablaColumnas = this.auditoriasContructorTabla.map(
      (column: any) => column.columnDef
    );

    //si no hay paginador, se crea
    if (!this.paginator) {
      this.auditoriasDataSource.paginator = this.paginator;
      this.auditoriasDataSource.sort = this.sort;
    }

  }

  manejarCambioPaginado(evento: PageEvent) {
    // Actualizar el índice de página y tamaño de página
    this.pageSize = evento.pageSize;
    this.pageIndex = evento.pageIndex;

    const offset = this.pageIndex * this.pageSize;
    this.listarAuditoriasPorVigencia(this.vigenciaId!, this.pageSize, offset);
    // Actualizar el paginador después de realizar la consulta
    this.paginator.length = this.totalRegistros;
    this.paginator.pageSize = this.pageSize;
    this.paginator.pageIndex = this.pageIndex;
  }

  agregarAuditor(auditoria?: Auditoria) {
    const dialogRef = this.dialog.open(ModalAgregarAuditorComponent, {
      width: "1100px",
      data: {
        auditoria,
        usuarioRol: [environment.ROL.AUDITOR_EXPERTO, environment.ROL.AUDITOR, environment.ROL.AUDITOR_ASISTENTE].find(rol => this.rolService.tieneRol(rol)),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.listarAuditoriasPorVigencia(
          this.vigenciaId,
          this.pageSize,
          this.pageIndex * this.pageSize
        );
      }
    });
  }
}
