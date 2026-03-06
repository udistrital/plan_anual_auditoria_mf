import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { seguimientosConstructorTabla } from "./tabla-seguimientos.utilidades";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { Router } from "@angular/router";
import { AlertService } from "src/app/shared/services/alert.service";
import { RolService } from "src/app/core/services/rol.service";
import { UserService } from "src/app/core/services/user.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { MatDialog } from "@angular/material/dialog";
import { ModalHistorialRechazosSeguimientoComponent } from "../modal-historial-rechazos-seguimiento/modal-historial-rechazos-seguimiento.component";
import { accionesEjecucionFinal } from "src/app/shared/utils/accionesPorRolYEstado";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-tabla-seguimientos",
  templateUrl: "./tabla-seguimientos.component.html",
  styleUrls: ["./tabla-seguimientos.component.css"],
})
export class TablaSeguimientosComponent implements OnInit {
  @Input() vigenciaId: any;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  seguimientosPorVigencia: any[] = [];
  seguimientosDataSource: MatTableDataSource<any> = new MatTableDataSource();
  seguimientosConstructorTabla: any;
  banderaTablaSeguimientos: boolean = false;
  tablaColumnas: any;
  roles: string[] = [];
  totalRegistros: number = 0;
  pageSize: number = 5;
  pageIndex: number = 0;
  itemsPerPage: number[] = [5, 10, 20];
  mostrarAcciones: boolean = false;
  iconosAccion = new Map<string, string>([
    ["Editar Informe", "edit"],
    ["Ver Documentos del informe", "description"],
    ["Enviar a Aprobación por Jefe", "send"],
    ["Historial de Rechazos", "history"],
  ]);

  constructor(
    private alertaService: AlertService,
    private rolService: RolService,
    private userService: UserService,
    private changeDetector: ChangeDetectorRef,
    private planAuditoriaMid: PlanAnualAuditoriaMid,
    private planAuditoriaService: PlanAnualAuditoriaService,
    private referenciaPdfService: ReferenciaPdfService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.roles = this.rolService.getRoles();
    this.setPermisos();
  }

  setPermisos() {
    if (this.rolService.mostrarAcciones(accionesEjecucionFinal)) {
      this.mostrarAcciones = true;
    }
  }

  listarSeguimientosPorVigencia(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0
  ) {
    this.seguimientosPorVigencia = [];
    const url = `auditoria?query=vigencia_id:${vigenciaId},activo:true,estado_id__gte:${environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL}&limit=${limit}&offset=${offset}`;

    this.planAuditoriaMid.get(url).subscribe((res) => {
      const seguimientos: any[] = res.Data.map((seguimiento: any) => {
        const estadoId = seguimiento.estado?.estado_id;

        console.log("estado:", estadoId);
        
        const acciones = this.getAccionesPorRolYEstado(estadoId);
        return { ...seguimiento, acciones };
      });

      if (!(seguimientos.length > 0)) {
        this.banderaTablaSeguimientos = false;
        this.seguimientosDataSource.data = [];
        return this.alertaService.showAlert(
          "No hay seguimientos registrados",
          "Actualmente no hay seguimientos registrados para la vigencia seleccionada."
        );
      }

      this.seguimientosPorVigencia = seguimientos;
      this.totalRegistros = res.MetaData.Count;
      this.banderaTablaSeguimientos = true;
      this.construirTabla();
    });

  }

  construirTabla() {
    this.seguimientosConstructorTabla = seguimientosConstructorTabla.filter(
      (column) => {
        return column.columnDef !== "acciones" || this.mostrarAcciones;
      }
    );
    this.tablaColumnas = this.seguimientosConstructorTabla.map(
      (column: any) => column.columnDef
    );

    this.seguimientosDataSource = new MatTableDataSource(
      this.seguimientosPorVigencia
    );

    //si no hay paginador, se crea
    if (!this.paginator) {
      this.seguimientosDataSource.paginator = this.paginator;
      this.seguimientosDataSource.sort = this.sort;
    }

    this.changeDetector.detectChanges();
  }

  manejarCambioPaginado(evento: PageEvent) {
    // Actualizar el índice de página y tamaño de página
    this.pageSize = evento.pageSize;
    this.pageIndex = evento.pageIndex;

    const offset = this.pageIndex * this.pageSize;
    this.listarSeguimientosPorVigencia(this.vigenciaId, this.pageSize, offset);
    // Actualizar el paginador después de realizar la consulta
    this.paginator.length = this.totalRegistros;
    this.paginator.pageSize = this.pageSize;
    this.paginator.pageIndex = this.pageIndex;
  }

  getAccionesPorRolYEstado(estado: number) {
    return Array.from(
      new Set(
        this.roles.flatMap((rol) => accionesEjecucionFinal[rol]?.[estado] || [])
      )
    );
  }

  getIconoAccion(accion: string): string {
    return this.iconosAccion.get(accion) ?? "help";
  }

  realizarAccion(seguimiento: any, accion: string) {
    const acciones: Record<string, Function | null> = {
      "Editar Informe": () => this.editarInformeSeguimiento(seguimiento),
      "Ver Documentos del informe": () => this.verDocumentosInforme(seguimiento),
      "Enviar a Aprobación por Jefe": () => this.enviarAprobacionPorJefe(seguimiento),
      "Historial de Rechazos": () => this.abrirHistorialRechazos(seguimiento),
    };
    acciones[accion]?.();
  }

  abrirHistorialRechazos(seguimiento: any) {
    this.dialog.open(ModalHistorialRechazosSeguimientoComponent, {
      data: { auditoriaId: seguimiento._id },
      width: "40%",
    });
  }

  editarInformeSeguimiento(seguimiento: any) {
    const seguimientoId = seguimiento._id;
    this.router.navigate([
      `/ejecucion/seguimiento-informes/editar-informe/${seguimientoId}`,
    ]);
  }

  verDocumentosInforme(seguimiento: any) {
    const seguimientoId = seguimiento._id;
    this.router.navigate([
      `/ejecucion/seguimiento-informes/revision/${seguimientoId}`,
    ]);
  }

  enviarAprobacionPorJefe(seguimiento: any) {
    this.validarInformeFinal(seguimiento._id, async () => {
      const confirmado = await this.alertaService.showConfirmAlert(
        "¿Está seguro(a) de enviar el informe final para aprobación del Jefe?"
      );
      if (!confirmado.value) return;

      const usuarioId = await this.userService.getPersonaId();
      const role = this.rolService.getRolPrioritario([
        environment.ROL.AUDITOR_EXPERTO,
        environment.ROL.AUDITOR,
        environment.ROL.AUDITOR_ASISTENTE,
      ]);

      this.planAuditoriaService
        .post("auditoria-estado", {
          auditoria_id: seguimiento._id,
          fase_id: environment.AUDITORIA_FASE.EJECUCION_FINAL,
          estado_id: environment.AUDITORIA_ESTADO.EJECUCION.REVISION_INFORME_FINAL_JEFE,
          usuario_id: usuarioId,
          usuario_rol: role,
          observacion: "",
        })
        .subscribe({
          next: () => {
            this.alertaService.showSuccessAlert(
              "El informe final fue enviado al Jefe para su aprobación.",
              "Informe enviado"
            );
            this.listarSeguimientosPorVigencia(this.vigenciaId);
          },
          error: () => {
            this.alertaService.showErrorAlert("Error al enviar el informe al Jefe.");
          },
        });
    });
  }

  private validarInformeFinal(seguimientoId: string, onValido: () => void) {
    this.referenciaPdfService.consultarDocumentos(seguimientoId).subscribe(docs => {
      if (!docs.some(doc => doc.tipo_id === environment.TIPO_DOCUMENTO_PARAMETROS.INFORME_FINAL)) {
        this.alertaService.showErrorAlert(
          "Debe generar el informe final antes de enviarlo al Jefe."
        );
        return;
      }
      onValido();
    });
  }
}