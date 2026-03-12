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
import { colocacionesContructorTabla } from "./tabla-auditorias-internas.utilidades";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { Auditoria } from "src/app/shared/data/models/auditoria";
import { ModalHistorialRechazosComponent } from "../modal-historial-rechazos/modal-historial-rechazos.component";
import { AlertService } from "src/app/shared/services/alert.service";
import { RolService } from "src/app/core/services/rol.service";
import { UserService } from "src/app/core/services/user.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { accionesEjecucionPreliminar } from "src/app/shared/utils/accionesPorRolYEstado";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-tabla-auditorias-internas",
  templateUrl: "./tabla-auditorias-internas.component.html",
  styleUrls: ["./tabla-auditorias-internas.component.css"],
})
export class TablaAuditoriasInternasComponent implements OnInit {
  @Input() vigenciaId: any;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  auditoriasDataSource: MatTableDataSource<any> = new MatTableDataSource();
  auditoriasPorVigencia: Auditoria[] = [];
  auditoriasContructorTabla: any;
  banderaTablaAuditoriasInternas: boolean = false;
  tablaColumnas: any;
  roles: string[] = [];
  totalRegistros: number = 0;
  pageSize: number = 5;
  pageIndex: number = 0;
  itemsPerPage: number[] = [5, 10, 20];
  mostrarAcciones: boolean = false;
  tipoConsulta: 'general' | 'auditor' | 'auditado' = 'general';
  personaId: number = 0;
  cargoId: number = 0;
  iconosAccion = new Map<string, string>([
    ["Editar Preinforme", "edit_note"],
    ["Editar informe", "edit"],
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
  ) {}

  async ngOnInit() {
    this.roles = this.rolService.getRoles();
    this.setPermisos();
    await this.configurarTipoConsulta();
  }

  setPermisos() {
    if (this.rolService.mostrarAcciones(accionesEjecucionPreliminar)) {
      this.mostrarAcciones = true;
    }
  }

  private async configurarTipoConsulta() {
    if (this.rolService.tieneRol(environment.ROL.JEFE_DEPENDENCIA)) {
      this.tipoConsulta = 'auditado';
      this.cargoId = environment.CARGO.JEFE_DEPENDENCIA_ID;
      this.personaId = await this.userService.getPersonaId();
    } else if (this.rolService.tieneRol(environment.ROL.ASISTENTE_DEPENDENCIA)) {
      this.tipoConsulta = 'auditado';
      this.cargoId = environment.CARGO.ASISTENTE_DEPENDENCIA_ID;
      this.personaId = await this.userService.getPersonaId();
    } else if (
      this.rolService.tieneRol(environment.ROL.AUDITOR) ||
      this.rolService.tieneRol(environment.ROL.AUDITOR_ASISTENTE) ||
      this.rolService.tieneRol(environment.ROL.AUDITOR_EXPERTO)
    ) {
      this.tipoConsulta = 'auditor';
      this.personaId = await this.userService.getPersonaId();
    }
    // ADMIN, AUDITOR_EXPERTO, JEFE → tipoConsulta = 'general' (default)
  }

  listarAuditoriasPorVigencia(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0
  ) {
    this.auditoriasPorVigencia = [];
    const queryBase = `query=vigencia_id:${vigenciaId},activo:true,estado_id__gte:${environment.AUDITORIA_ESTADO.EJECUCION.POR_EJECUTAR}&limit=${limit}&offset=${offset}`;
    let url: string;
    switch (this.tipoConsulta) {
      case 'auditado':
        url = `auditoria/auditado/${this.personaId}/${this.cargoId}?${queryBase}`;
        break;
      case 'auditor':
        url = `auditoria/auditor/${this.personaId}?${queryBase}`;
        break;
      default:
        url = `auditoria?${queryBase}`;
        break;
    }

    this.planAuditoriaMid
      .get(url)
      .subscribe((res) => {
        const auditorias: any[] = res.Data.map((auditoria: any) => {
          const estadoId = auditoria.estado?.estado_id;
          const acciones = this.getAccionesPorRolYEstado(estadoId);
          return { ...auditoria, acciones };
        });

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
    this.auditoriasContructorTabla = colocacionesContructorTabla.filter(
      (column) => {
        return column.columnDef !== "acciones" || this.mostrarAcciones;
      }
    );
    this.tablaColumnas = this.auditoriasContructorTabla.map(
      (column: any) => column.columnDef
    );

    this.auditoriasDataSource = new MatTableDataSource(
      this.auditoriasPorVigencia
    );

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
        this.roles.flatMap((rol) => accionesEjecucionPreliminar[rol]?.[estado] || [])
      )
    );
  }

  getIconoAccion(accion: string): string {
    return this.iconosAccion.get(accion) ?? "help";
  }

  realizarAccion(auditoria: any, accion: string) {
    const acciones: Record<string, Function | null> = {
      "Editar Preinforme": () => this.editarPreinforme(auditoria),
      "Editar informe": () => this.editarInforme(auditoria),
      "Ver Documentos del informe": () => this.verDocumentosInforme(auditoria),
      "Enviar a Aprobación por Jefe": () => this.enviarAprobacionPorJefe(auditoria),
      "Historial de Rechazos": () => this.abrirHistorialRechazos(auditoria),
    };
    acciones[accion]?.();
  }

  abrirHistorialRechazos(auditoria: Auditoria) {
    this.dialog.open(ModalHistorialRechazosComponent, {
      data: { auditoriaId: auditoria._id },
      width: "40%",
    });
  }

  editarPreinforme(auditoria: Auditoria) {
    console.log("Editar Preinforme", auditoria);
    const auditoriaId = auditoria._id;
    this.router.navigate([
      `/ejecucion/auditorias-internas/editar-informe/${auditoriaId}`, // TODO: Se deberia pasar auditoriaId o informeId?
    ]);
  }

  editarInforme(auditoria: Auditoria) {
    const auditoriaId = auditoria._id;
    this.router.navigate([
      `/ejecucion/auditorias-internas/editar-informe/${auditoriaId}`, // TODO: Se deberia pasar auditoriaId o informeId?
    ]);
  }

  verDocumentosInforme(auditoria: Auditoria) {
    const auditoriaId = auditoria._id;
    this.router.navigate([
      `/ejecucion/auditorias-internas/revision/${auditoriaId}`,
    ]);
  }

  enviarAprobacionPorJefe(auditoria: Auditoria) {
    this.validarInformePreliminar(auditoria._id, async () => {
      const confirmado = await this.alertaService.showConfirmAlert(
        "¿Está seguro(a) de enviar el informe preliminar para aprobación del Jefe?"
      );
      if (!confirmado.value) return;

      // Solo los auditores pueden enviar a aprobación por jefe
      const usuarioId = await this.userService.getPersonaId();
      const role = this.rolService.getRolPrioritario([
        environment.ROL.AUDITOR_EXPERTO,
        environment.ROL.AUDITOR,
        environment.ROL.AUDITOR_ASISTENTE,
      ]);

      // Enviar a aprobación por jefe
      this.planAuditoriaService
        .post("auditoria-estado", {
          auditoria_id: auditoria._id,
          fase_id: environment.AUDITORIA_FASE.EJECUCION_PRELIMINAR,
          estado_id: environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE,
          usuario_id: usuarioId,
          usuario_rol: role,
          observacion: "",
        })
        .subscribe({
          next: () => {
            this.alertaService.showSuccessAlert(
              "El informe fue enviado al Jefe para su aprobación.",
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

  // Valida que el informe preliminar exista antes de permitir enviar a aprobación por jefe
  private validarInformePreliminar(auditoriaId: string, onValido: () => void) {
    this.referenciaPdfService.consultarDocumentos(auditoriaId).subscribe(docs => {
      if (!docs.some(doc => doc.tipo_id === environment.TIPO_DOCUMENTO_PARAMETROS.INFORME_PRELIMINAR)) {
        this.alertaService.showErrorAlert(
          "Debe generar el informe preliminar antes de enviarlo al Jefe."
        );
        return;
      }
      onValido();
    });
  }
}
