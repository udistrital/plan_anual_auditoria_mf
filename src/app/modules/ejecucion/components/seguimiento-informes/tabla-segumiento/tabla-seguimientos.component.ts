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

  auditoriasPorVigencia: any[] = [];
  auditoriasDataSource: MatTableDataSource<any> = new MatTableDataSource();
  constructorTablaAuditorias: any;
  banderaTablaAuditorias: boolean = false;
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

  listarAuditoriasPorVigencia(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0
  ) {
    this.auditoriasPorVigencia = [];
    const url = `auditoria?query=vigencia_id:${vigenciaId},activo:true,tipo_evaluacion_id:${environment.TIPO_EVALUACION.SEGUIMIENTO_ID},estado_id__gte:${environment.AUDITORIA_ESTADO.EJECUCION.POR_EJECUTAR}&limit=${limit}&offset=${offset}`;

    this.planAuditoriaMid.get(url).subscribe((res) => {
      const auditorias: any[] = res.Data.map((auditoria: any) => {
        const estadoId = auditoria.estado?.estado_id || auditoria.estado_id;
        const acciones = this.getAccionesPorRolYEstado(estadoId);
        return { ...auditoria, acciones };
      });

      if (!(auditorias.length > 0)) {
        this.banderaTablaAuditorias = false;
        this.auditoriasDataSource.data = [];
        return this.alertaService.showAlert(
          "No hay auditorías registradas",
          "Actualmente no hay auditorías registradas para la vigencia seleccionada."
        );
      }

      this.auditoriasPorVigencia = auditorias;
      this.totalRegistros = res.MetaData.Count;
      this.banderaTablaAuditorias = true;
      this.construirTabla();
    });

  }

  construirTabla() {
    this.constructorTablaAuditorias = seguimientosConstructorTabla.filter(
      (column) => {
        return column.columnDef !== "acciones" || this.mostrarAcciones;
      }
    );
    this.tablaColumnas = this.constructorTablaAuditorias.map(
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

  realizarAccion(auditoria: any, accion: string) {
    const acciones: Record<string, Function | null> = {
      "Editar Informe": () => this.editarInforme(auditoria),
      "Ver Documentos del informe": () => this.verDocumentosInforme(auditoria),
      "Enviar a Aprobación por Jefe": () => this.enviarAprobacionPorJefe(auditoria),
      "Historial de Rechazos": () => this.abrirHistorialRechazos(auditoria),
    };
    acciones[accion]?.();
  }

  abrirHistorialRechazos(auditoria: any) {
    this.dialog.open(ModalHistorialRechazosSeguimientoComponent, {
      data: { auditoriaId: auditoria._id },
      width: "40%",
    });
  }

  editarInforme(auditoria: any) {
    this.obtenerOCrearInforme(auditoria._id, (informeId) => {
      this.router.navigate([`/ejecucion/seguimiento-informes/editar-informe/${informeId}`]);
    });
  }

  private obtenerOCrearInforme(auditoriaId: string, onInformeId: (informeId: string) => void) {
    this.planAuditoriaService.get(`informe?query=auditoria_id:${auditoriaId},activo:true`).subscribe({
      next: (res: any) => {
        if (res.Data && res.Data.length > 0) {
          onInformeId(res.Data[0]._id);
        } else {
          this.planAuditoriaService.post('informe', { auditoria_id: auditoriaId }).subscribe({
            next: (informeCreado: any) => {
              this.crearEstadoCreandoInformeFinal(auditoriaId, informeCreado.Data._id, onInformeId);
            },
            error: () => this.alertaService.showErrorAlert('Error al crear el informe.')
          });
        }
      },
      error: () => this.alertaService.showErrorAlert('Error al buscar el informe.')
    });
  }

  private async crearEstadoCreandoInformeFinal(auditoriaId: string, informeId: string, onDone: (informeId: string) => void) {
    const usuarioId = await this.userService.getPersonaId();
    const role = this.rolService.getRolPrioritario([
      environment.ROL.AUDITOR_EXPERTO,
      environment.ROL.AUDITOR,
      environment.ROL.AUDITOR_ASISTENTE,
    ]);
    this.planAuditoriaService.post('auditoria-estado', {
      auditoria_id: auditoriaId,
      fase_id: environment.AUDITORIA_FASE.EJECUCION_FINAL,
      estado_id: environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL,
      usuario_id: usuarioId,
      usuario_rol: role,
      observacion: "",
    }).subscribe({
      next: () => onDone(informeId),
      error: () => {
        this.alertaService.showErrorAlert('Error al registrar el estado del informe.');
        onDone(informeId);
      }
    });
  }

  verDocumentosInforme(auditoria: any) {
    this.router.navigate([
      `/ejecucion/seguimiento-informes/revision/${auditoria._id}`,
    ]);
  }

  enviarAprobacionPorJefe(auditoria: any) {
    this.validarInformeFinal(auditoria._id, async () => {
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
          auditoria_id: auditoria._id,
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
            this.listarAuditoriasPorVigencia(this.vigenciaId);
          },
          error: () => {
            this.alertaService.showErrorAlert("Error al enviar el informe al Jefe.");
          },
        });
    });
  }

  private validarInformeFinal(auditoriaId: string, onValido: () => void) {
    this.referenciaPdfService.consultarDocumentos(auditoriaId).subscribe(docs => {
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