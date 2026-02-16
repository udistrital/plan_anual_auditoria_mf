import { ChangeDetectorRef, Component, Input, ViewChild } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
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
  auditoriasDataSource: MatTableDataSource<any> = new MatTableDataSource();
  auditoriasContructorTabla: any;
  banderaTablaAuditoriasInternas: boolean = false;
  tablaColumnas: any;
  totalRegistros: number = 0;
  pageSize: number = 5;
  pageIndex: number = 0;
  itemsPerPage: number[] = [5, 10, 20];
  permiso: boolean = false;

  constructor(
    private readonly alertaService: AlertService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly dialog: MatDialog,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly rolService: RolService
  ) {}

  ngOnInit() {
    this.setPermisos();
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
          `plan-auditoria?filter=vigencia_id:${vigenciaId},estado_plan_id:${environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID},activo:true`
        )
        .subscribe(
          (res) => {
            const tienePAAAprobado = res.Data && res.Data.length > 0;
            resolve(tienePAAAprobado);
          },
          (error) => {
            console.error("Error al verificar PAA aprobado:", error);
            reject(error);
          }
        );
    });
  }

  private mostrarModalSinAuditorias(): void {
    this.dialog.open(ModalSinAuditoriasComponent, {
      width: "450px",
      disableClose: false,
    });
  }

  listarAuditoriasPorVigencia(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0
  ): void {
    this.auditoriasPorVigencia = [];
    this.banderaTablaAuditoriasInternas = false;
    this.auditoriasDataSource.data = [];

    // Primero verificar si hay PAAs aprobados
    this.verificarPAAAprobado(vigenciaId)
      .then((tienePAAAprobado) => {
        if (!tienePAAAprobado) {
          // No hay PAA aprobado, mostrar modal
          this.mostrarModalSinAuditorias();
          return;
        }

        // Si hay PAA aprobado, consultar auditorías que NO estén en borrador
        const auditorias$ = this.planAuditoriaMid.get(
          `auditoria?filter=vigencia_id:${vigenciaId},activo:true,estado_id__ne:${environment.AUDITORIA_ESTADO.PROGRAMACION.BORRADOR_ID}&limit=${limit}&offset=${offset}&auditores`
        );

        auditorias$.subscribe(
          (res) => {
            const auditorias: Auditoria[] = Array.isArray(res.Data)
              ? res.Data
              : [];
            console.log("Consulta aud Mid (Filtrado PAA aprobado): ", auditorias);

            if (auditorias.length === 0) {
              // Hay PAA aprobado pero no hay auditorías en estado válido
              this.mostrarModalSinAuditorias();
              return;
            }

            // Procesar auditorías
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
          }
        );
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

@Component({
  selector: 'app-modal-sin-auditorias',
  template: `
    <div class="modal-container" style="padding: 20px; text-align: center;">
      <div style="display: flex; justify-content: center; margin-bottom: 20px;">
        <mat-icon color="warn" style="font-size: 60px; width: 60px; height: 60px;">
          info
        </mat-icon>
      </div>
      <p style="font-size: 16px; margin-bottom: 30px;">
        No existen auditorías aprobadas para la vigencia seleccionada.
      </p>
      <mat-dialog-actions align="center">
        <button 
          mat-raised-button 
          color="primary" 
          (click)="cerrar()"
          style="min-width: 120px;">
          Aceptar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .modal-container {
      min-width: 400px;
    }
  `]
})
export class ModalSinAuditoriasComponent {
  constructor(
    public dialogRef: MatDialogRef<ModalSinAuditoriasComponent>
  ) {}
  cerrar(): void {
    this.dialogRef.close();
  }
}