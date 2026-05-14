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
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { planMejoramientoConstructorTabla } from "./tabla-plan-mejoramiento.utilidades";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { RolService } from "src/app/core/services/rol.service";
import { UserService } from "src/app/core/services/user.service";
import { environment } from "src/environments/environment";
import { ModalAsignacionAuditoresComponent } from "./modal-asignacion-auditores/modal-asignacion-auditores.component";

@Component({
    selector: "app-tabla-plan-mejoramiento",
    templateUrl: "./tabla-plan-mejoramiento.component.html",
    styleUrls: ["./tabla-plan-mejoramiento.component.css"],
    standalone: false
})
export class TablaPlanMejoramientoComponent implements OnInit {
  @Input() vigenciaId: any;
  @Input() tipoEvaluacionId: any;
  @Input() role: any;
  @Input() personaId: any;
  @Input() accionesPermitidas: string[] | null = null;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  planesPorVigencia: any[] = [];
  planesDataSource: MatTableDataSource<any> = new MatTableDataSource();
  planesConstructorTabla: any;
  banderaTablePlanes: boolean = false;
  tablaColumnas: any;

  totalRegistros: number = 0;
  pageSize: number = 5;
  pageIndex: number = 0;
  itemsPerPage: number[] = [5, 10, 20];

  usuarioId: number = 0;
  cargoId: number = 0;
  roles: string[] = [];

  private tipoConsulta: "general" | "auditor" | "auditado" = "general";

  readonly iconosAccion = new Map<string, string>([
    ["Asignar Auditor(es)",       "manage_accounts"],
    ["Registrar Plan",            "edit"],
    ["Enviar a Revisión",         "send"],
    ["Ver Documentos Auditoría",  "description"],
  ]);

  constructor(
    private readonly alertaService: AlertService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly dialog: MatDialog,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly rolService: RolService,
    private readonly userService: UserService,
    private readonly router: Router
  ) {}

  async ngOnInit() {
    this.roles = this.rolService.getRoles();
    this.usuarioId = await this.userService.getPersonaId();
    this.configurarTipoConsulta();
  }

  private configurarTipoConsulta(): void {
    if (this.rolService.tieneRol(environment.ROL.JEFE_DEPENDENCIA)) {
      this.tipoConsulta = "auditado";
      this.cargoId = environment.CARGO.JEFE_DEPENDENCIA_ID;
    } else if (this.rolService.tieneRol(environment.ROL.ASISTENTE_DEPENDENCIA)) {
      this.tipoConsulta = "auditado";
      this.cargoId = environment.CARGO.ASISTENTE_DEPENDENCIA_ID;
    } else if (
      this.rolService.tieneRol(environment.ROL.AUDITOR) ||
      this.rolService.tieneRol(environment.ROL.AUDITOR_ASISTENTE) ||
      this.rolService.tieneRol(environment.ROL.AUDITOR_EXPERTO)
    ) {
      this.tipoConsulta = "auditor";
    } else {
      this.tipoConsulta = "general";
    }
  }

  listarPlanesPorFiltros(
    vigenciaId: number,
    tipoEvaluacionId: number,
    limit: number = this.pageSize,
    offset: number = 0
  ): void {
    this.vigenciaId = vigenciaId;
    this.tipoEvaluacionId = tipoEvaluacionId;
    this.planesPorVigencia = [];

    const baseQuery = `vigencia_id:${vigenciaId},tipo_evaluacion_id:${tipoEvaluacionId},activo:true`;
    const endpoint = this.construirEndpoint(baseQuery, limit, offset);

    this.planAuditoriaMid.get(endpoint).subscribe({
      next: (res) => {
        const auditorias: any[] = res?.Data ?? [];

        if (!auditorias.length) {
          this.alertaService.showAlert(
            "Sin resultados",
            "No se encontraron auditorías para la vigencia y tipo de evaluación seleccionados."
          );
          this.resetTabla();
          return;
        }

        this.planesPorVigencia = auditorias.map((auditoria: any) => {
          const estadoId = auditoria.estado?.estado_id ?? auditoria.estado_id;
          return {
            ...auditoria,
            acciones: this.getAccionesPorRolYEstado(estadoId),
          };
        });

        this.totalRegistros = res?.MetaData?.Count ?? auditorias.length;
        this.banderaTablePlanes = true;
        this.construirTabla();
      },
      error: (error) => {
        console.error("Error al consultar auditorías:", error);
        this.alertaService.showErrorAlert(
          "Ocurrió un error al consultar las auditorías. Por favor, intente nuevamente."
        );
        this.resetTabla();
      },
    });
  }

  private construirEndpoint(baseQuery: string, limit: number, offset: number): string {
    switch (this.tipoConsulta) {
      case "auditado":
        return `auditoria/auditado/${this.personaId}/${this.cargoId}?query=${baseQuery}&limit=${limit}&offset=${offset}`;
      case "auditor":
        return `auditoria/auditor/${this.personaId}?query=${baseQuery}&limit=${limit}&offset=${offset}`;
      default:
        return `auditoria?query=${baseQuery}&limit=${limit}&offset=${offset}`;
    }
  }

  getAccionesPorRolYEstado(estadoId: number): string[] {
    // para traer las acciones posterior del ./utils/accionesPorRolYEstado
    const acciones = ["Asignar Auditor(es)", "Registrar Plan", "Enviar a Revisión", "Ver Documentos Auditoría"];
    return this.accionesPermitidas
      ? acciones.filter(a => this.accionesPermitidas!.includes(a))
      : acciones;
  }

  getIconoAccion(accion: string): string {
    return this.iconosAccion.get(accion) ?? "help_outline";
  }

  realizarAccion(plan: any, accion: string): void {
    const acciones: Record<string, () => void> = {
      "Asignar Auditor(es)":      () => this.asignarAuditores(plan),
      "Registrar Plan":           () => this.registrarPlan(plan),
      "Enviar a Revisión":        () => this.enviarAprobacion(plan),
      "Ver Documentos Auditoría": () => this.verDocumentosAuditoria(plan),
    };
    acciones[accion]?.();
  }

  asignarAuditores(plan: any): void {
    const dialogRef = this.dialog.open(ModalAsignacionAuditoresComponent, {
      width: "800px",
      data: { auditoria: plan, usuarioId: this.usuarioId, role: this.role },
    });
    dialogRef.afterClosed().subscribe((guardado: boolean) => {
      if (guardado) {
        this.listarPlanesPorFiltros(this.vigenciaId, this.tipoEvaluacionId, this.pageSize, this.pageIndex * this.pageSize);
      }
    });
  }

  registrarPlan(plan: any): void {
      this.router.navigate([`/plan-mejoramiento/registrar-plan/${plan._id}`]);
  }

  enviarAprobacion(plan: any): void {
    console.log("Enviar a aprobación:", plan);
  }

  verDocumentosAuditoria(plan: any): void {
    console.log("Ver documentos de auditoría:", plan);
  }

  private resetTabla(): void {
    this.planesPorVigencia = [];
    this.totalRegistros = 0;
    this.banderaTablePlanes = false;
    this.planesDataSource.data = [];
    if (this.paginator) this.paginator.length = 0;
  }

  private construirTabla(): void {
    this.planesConstructorTabla = planMejoramientoConstructorTabla;
    this.tablaColumnas = this.planesConstructorTabla.map((c: any) => c.columnDef);
    this.planesDataSource = new MatTableDataSource(this.planesPorVigencia);
    if (this.paginator) {
      this.planesDataSource.paginator = this.paginator;
      this.paginator.length = this.totalRegistros;
      this.paginator.pageSize = this.pageSize;
      this.paginator.pageIndex = this.pageIndex;
    }
    if (this.sort) this.planesDataSource.sort = this.sort;
    this.changeDetector.detectChanges();
  }

  manejarCambioPaginado(evento: PageEvent): void {
    this.pageSize = evento.pageSize;
    this.pageIndex = evento.pageIndex;
    this.listarPlanesPorFiltros(this.vigenciaId, this.tipoEvaluacionId, this.pageSize, this.pageIndex * this.pageSize);
  }
}