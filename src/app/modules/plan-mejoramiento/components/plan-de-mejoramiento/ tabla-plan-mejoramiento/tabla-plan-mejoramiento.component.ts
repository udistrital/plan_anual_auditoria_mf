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
import { forkJoin, of } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { planMejoramientoConstructorTabla } from "./tabla-plan-mejoramiento.utilidades";
import { accionesPlanMejoramiento } from "src/app/shared/utils/accionesPorRolYEstado";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { RolService } from "src/app/core/services/rol.service";
import { UserService } from "src/app/core/services/user.service";
import { environment } from "src/environments/environment";
import { ModalAsignacionAuditoresComponent } from "./modal-asignacion-auditores/modal-asignacion-auditores.component";
import { HistorialRechazosData, ModalHistorialRechazosComponent } from "src/app/shared/elements/components/dialogs/modal-historial-rechazos/modal-historial-rechazos.component";

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
    ["Ver Plan",                  "visibility"],
    ["Aprobar Plan",              "check_circle"],
    ["Rechazar Plan",             "cancel"],
    ["Ver Documentos Auditoría",  "description"],
    ["Ver Observaciones",         "history"],
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

  ngOnInit(): void {
    this.roles = this.rolService.getRoles();
    this.configurarTipoConsulta();
  }

  private configurarTipoConsulta(): void {
    if (this.rolService.tieneRol(environment.ROL.JEFE_DEPENDENCIA)) {
      this.tipoConsulta = "auditado";
      this.cargoId = environment.CARGO.JEFE_DEPENDENCIA_ID;
      this.userService.getPersonaId().then((id) => { this.usuarioId = id; });
    } else if (this.rolService.tieneRol(environment.ROL.ASISTENTE_DEPENDENCIA)) {
      this.tipoConsulta = "auditado";
      this.cargoId = environment.CARGO.ASISTENTE_DEPENDENCIA_ID;
      this.userService.getPersonaId().then((id) => { this.usuarioId = id; });
    } else if (
      this.rolService.tieneRol(environment.ROL.AUDITOR) ||
      this.rolService.tieneRol(environment.ROL.AUDITOR_ASISTENTE)
    ) {
      this.tipoConsulta = "auditor";
      this.userService.getPersonaId().then((id) => { this.usuarioId = id; });
    } else {
      // JEFE, AUDITOR_EXPERTO y otros roles usan endpoint general
      this.userService.getPersonaId().then((id) => { this.usuarioId = id; });
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

    const estadoEjecucionFinal = environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_INFORME_FINAL_JEFE;
    const baseQuery = `vigencia_id:${vigenciaId},tipo_evaluacion_id:${tipoEvaluacionId},activo:true,estado_id:${estadoEjecucionFinal}`;
    const endpoint = this.construirEndpoint(baseQuery, limit, offset);

    this.planAuditoriaMid.get(endpoint).pipe(
      switchMap((res) => {
        const auditorias: any[] = res?.Data ?? [];

        if (!auditorias.length) {
          return of({ auditorias: [], count: 0, planes: [], auditores: [] });
        }

        const planes$ = forkJoin(
          auditorias.map((a) =>
            this.planAuditoriaMid
              .get(`plan-mejoramiento?query=auditoria_id:${a._id},activo:true`)
              .pipe(catchError(() => of({ Data: [] })))
          )
        );

        return planes$.pipe(
          switchMap((planesRes) => {
            const planes = planesRes.map((r: any) => r.Data?.[0] ?? null);

            const auditores$ = forkJoin(
              planes.map((plan: any) =>
                plan
                  ? this.planAuditoriaMid
                      .get(`plan-mejoramiento-auditor?query=plan_mejoramiento_id:${plan._id},activo:true`)
                      .pipe(catchError(() => of({ Data: [] })))
                  : of({ Data: [] })
              )
            );

            return auditores$.pipe(
              map((auditoresRes) => ({
                auditorias,
                count: res?.MetaData?.Count ?? auditorias.length,
                planes,
                auditores: auditoresRes,
              }))
            );
          })
        );
      })
    ).subscribe({
      next: ({ auditorias, count, planes, auditores }) => {
        if (!auditorias.length) {
          this.alertaService.showAlert(
            "Sin resultados",
            "No se encontraron auditorías para la vigencia y tipo de evaluación seleccionados."
          );
          this.resetTabla();
          return;
        }

        this.planesPorVigencia = auditorias.map((auditoria: any, i: number) => {
          const plan = planes[i];
          const estadoPlanId = plan?.estado_id
            ?? environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.SIN_PLAN_MEJORAMIENTO;
          const auditoresPlan = ((auditores as any[])[i]?.Data ?? []).map((a: any) => ({
            nombre: a.auditor_nombre ?? `Auditor ${a.auditor_id}`,
          }));

          return {
            ...auditoria,
            planMejoramientoId: plan?._id ?? null,
            estadoPlanId,
            estadoPlanNombre: plan?.estado_nombre ?? 'Sin Plan de Mejoramiento',
            auditores_plan: auditoresPlan,
            acciones: this.getAccionesPorRolYEstado(estadoPlanId),
          };
        });

        this.totalRegistros = count;
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
        return `auditoria/auditado/${this.usuarioId}/${this.cargoId}?query=${baseQuery}&limit=${limit}&offset=${offset}`;
      case "auditor":
        return `auditoria/auditor/${this.usuarioId}?query=${baseQuery}&limit=${limit}&offset=${offset}`;
      default:
        return `auditoria?query=${baseQuery}&limit=${limit}&offset=${offset}`;
    }
  }

  getAccionesPorRolYEstado(estadoId: number): string[] {
    const acciones = Array.from(
      new Set(this.roles.flatMap(rol => accionesPlanMejoramiento[rol]?.[estadoId] ?? []))
    );
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
      "Ver Plan":                 () => this.verPlan(plan),
      "Aprobar Plan":             () => this.aprobarPlan(plan),
      "Rechazar Plan":            () => this.rechazarPlan(plan),
      "Ver Documentos Auditoría": () => this.verDocumentosAuditoria(plan),
      "Ver Observaciones":        () => this.verObservaciones(plan),
    };
    acciones[accion]?.();
  }

  asignarAuditores(plan: any): void {
    const dialogRef = this.dialog.open(ModalAsignacionAuditoresComponent, {
      width: "1100px",
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
    const planId = plan.planMejoramientoId;
    if (!planId) {
      this.alertaService.showAlert('Sin plan', 'Primero debe registrar el plan desde la acción "Registrar Plan".');
      return;
    }

    // auditores_plan ya viene cargado desde listarPlanesPorFiltros (MID)
    const auditores: any[] = plan.auditores_plan ?? [];
    if (!auditores.length) {
      this.alertaService.showAlert(
        'Sin auditores asignados',
        'Debe asignar al menos un auditor responsable antes de enviar el plan a revisión.'
      );
      return;
    }

    this.alertaService.showConfirmAlert('¿Enviar el plan al auditor para revisión?').then(conf => {
      if (!conf.value) return;

      const body = {
        plan_mejoramiento_id:   planId,
        usuario_id:             this.usuarioId,
        usuario_rol:            this.role,
        observacion:            'Plan enviado a revisión del auditor',
        estado_id:              environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.REVISION_PLAN_MEJORAMIENTO_AUDITOR,
        fase_id:                environment.AUDITORIA_FASE.PLAN_MEJORAMIENTO,
        fecha_ejecucion_estado: new Date().toISOString(),
        activo:                 true,
      };

      this.planAuditoriaService.post('plan-mejoramiento-estado', body).subscribe({
        next: () => {
          this.alertaService.showSuccessAlert('El plan fue enviado al auditor para revisión.', 'Enviado');
          this.listarPlanesPorFiltros(this.vigenciaId, this.tipoEvaluacionId, this.pageSize, this.pageIndex * this.pageSize);
        },
        error: () => {
          this.alertaService.showErrorAlert('Error al enviar el plan al auditor.');
        }
      });
    });
  }

  verPlan(plan: any): void {
    this.router.navigate([`/plan-mejoramiento/ver-plan/${plan._id}`]);
  }

  aprobarPlan(_plan: any): void {
  }

  rechazarPlan(_plan: any): void {
  }

  verObservaciones(plan: any): void {
    if (!plan.planMejoramientoId) {
      this.alertaService.showAlert('Sin plan', 'No hay plan de mejoramiento registrado para esta auditoría.');
      return;
    }

    const data: HistorialRechazosData = {
      auditoriaId: plan.planMejoramientoId,
      estadoEndpoint: "plan-mejoramiento-estado",
      auditoriaIdReferencia: "plan_mejoramiento_id",
      estadoRevisionIds: [environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.REVISION_PLAN_MEJORAMIENTO_AUDITOR],
      estadoRechazoIds: [environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.RECHAZADO_PLAN_MEJORAMIENTO],
      titulo: "Historial de observaciones",
      descripcion: `Lista de motivos de rechazo y observaciones - Auditoría ${plan.titulo ?? ''}`,
    } as HistorialRechazosData;

    this.dialog.open(ModalHistorialRechazosComponent, {
      width: '1000px',
      data: data,
    });
  }

  verDocumentosAuditoria(_plan: any): void {
    // pendiente
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
      this.paginator.length = this.totalRegistros;
      this.paginator.pageSize = this.pageSize;
      this.paginator.pageIndex = this.pageIndex;
    }
    this.changeDetector.detectChanges();
  }

  manejarCambioPaginado(evento: PageEvent): void {
    this.pageSize = evento.pageSize;
    this.pageIndex = evento.pageIndex;
    this.listarPlanesPorFiltros(this.vigenciaId, this.tipoEvaluacionId, this.pageSize, this.pageIndex * this.pageSize);
  }
}
