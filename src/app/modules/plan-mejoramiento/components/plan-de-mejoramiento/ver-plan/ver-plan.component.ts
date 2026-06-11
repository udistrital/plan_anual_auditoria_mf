import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { RolService } from 'src/app/core/services/rol.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';
import { ModalRechazoPlanComponent } from '../ tabla-plan-mejoramiento/modal-rechazo-plan/modal-rechazo-plan.component';

@Component({
  selector: 'app-ver-plan',
  templateUrl: './ver-plan.component.html',
  standalone: false,
})
export class VerPlanComponent implements OnInit {
  auditoriaId!: string;
  planMejoramientoId!: string;
  auditoria: any = null;
  cargando = true;

  planEstadoId: number | null = null;
  /** estado_id de cada acción de mejora del plan (para validar la decisión) */
  estadosAcciones: number[] = [];

  private role: string | null = null;
  private usuarioId = 0;

  readonly ESTADO_ACCION = environment.ACCION_MEJORA_ESTADOS;

  // El auditor está revisando y el plan está en revisión
  get modoRevision(): boolean {
    return this.mostrarAccionesRevision()
      && this.planEstadoId === environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.REVISION_PLAN_MEJORAMIENTO_AUDITOR;
  }

  // Plan aprobable solo si hay acciones y todas están APROBADA
  get todasAprobadas(): boolean {
    return this.estadosAcciones.length > 0
      && this.estadosAcciones.every(e => e === this.ESTADO_ACCION.APROBADA);
  }

  // Todas las acciones fueron revisadas (ninguna en PENDIENTE_REVISION)
  get todasRevisadas(): boolean {
    return this.estadosAcciones.length > 0
      && this.estadosAcciones.every(e => e !== this.ESTADO_ACCION.PENDIENTE_REVISION);
  }

  // Plan rechazable solo tras revisar todas y con al menos una RECHAZADA
  get algunaRechazada(): boolean {
    return this.todasRevisadas
      && this.estadosAcciones.some(e => e === this.ESTADO_ACCION.RECHAZADA);
  }

  readonly fuentes: Record<number, string> = {
    1: 'Auditoría Interna',
    2: 'Auditoría Externa',
    3: 'Producto/Servicio No Conforme',
    4: 'Quejas, reclamos o sugerencias',
    5: 'Revisión por la Dirección',
    6: 'Evaluación del desempeño',
    7: 'Mejoramiento Continuo',
  };

  fuenteNombre = '';

  get lideresDelProceso(): string {
    return (this.auditoria?.datos_dependencias ?? [])
      .map((d: any) => d.jefe_nombre).filter(Boolean).join(', ') || '';
  }

  get gestoresDelProceso(): string {
    return (this.auditoria?.datos_dependencias ?? [])
      .map((d: any) => d.dependencia_nombre).filter(Boolean).join(', ') || '';
  }

  mostrarAccionesRevision(): boolean {
    return this.rolService.permisoCreacion([
      environment.ROL.JEFE,
      environment.ROL.AUDITOR_EXPERTO,
      environment.ROL.AUDITOR,
    ]);
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly alertService: AlertService,
    private readonly rolService: RolService,
    private readonly userService: UserService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.auditoriaId = this.route.snapshot.paramMap.get('id')!;
    this.role = this.rolService.getRolPrioritario([
      environment.ROL.JEFE,
      environment.ROL.AUDITOR_EXPERTO,
      environment.ROL.AUDITOR,
      environment.ROL.AUDITOR_ASISTENTE,
    ]);
    this.usuarioId = await this.userService.getPersonaId();
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.planAuditoriaMid.get(`auditoria/${this.auditoriaId}`).subscribe({
      next: (res) => {
        this.auditoria = res.Data;
        this.cargarPlan();
      },
      error: () => { this.cargando = false; }
    });
  }

  private cargarPlan(): void {
    this.planAuditoriaService
      .get(`plan-mejoramiento?query=auditoria_id:${this.auditoriaId},activo:true`)
      .subscribe({
        next: (res) => {
          const plan = res?.Data?.[0];
          if (plan) {
            this.planMejoramientoId = plan._id;
            this.planEstadoId = plan.estado_id ?? null;
            this.fuenteNombre = this.fuentes[plan.fuente] ?? '';
            this.cargarEstadosAcciones();
          }
          this.cargando = false;
        },
        error: () => { this.cargando = false; }
      });
  }

  // Carga los estado_id de las acciones del plan para validar la decisión del plan
  cargarEstadosAcciones(): void {
    if (!this.planMejoramientoId) return;
    this.planAuditoriaService
      .get(`accion-mejora?query=plan_mejoramiento_id:${this.planMejoramientoId},activo:true&limit=0`)
      .subscribe({
        next: (res) => {
          this.estadosAcciones = (res?.Data ?? []).map(
            (a: any) => a.estado_id ?? this.ESTADO_ACCION.PENDIENTE_REVISION
          );
        },
        error: () => { this.estadosAcciones = []; }
      });
  }

  aprobar(): void {
    if (!this.todasAprobadas) {
      this.alertService.showAlert(
        'No se puede aprobar el plan',
        'Para aprobar el plan, todas las acciones de mejora deben estar aprobadas.'
      );
      return;
    }

    this.alertService.showConfirmAlert('¿Aprobar el plan de mejoramiento?').then(conf => {
      if (!conf.value) return;

      const body = {
        plan_mejoramiento_id:   this.planMejoramientoId,
        usuario_id:             this.usuarioId,
        usuario_rol:            this.role,
        observacion:            'Plan de mejoramiento aprobado',
        estado_id:              environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.APROBADO_PLAN_MEJORAMIENTO,
        fase_id:                environment.AUDITORIA_FASE.PLAN_MEJORAMIENTO,
        fecha_ejecucion_estado: new Date().toISOString(),
        activo:                 true,
      };

      this.planAuditoriaService.post('plan-mejoramiento-estado', body).subscribe({
        next: () => {
          this.alertService.showSuccessAlert('El plan de mejoramiento ha sido aprobado.', 'Aprobado')
            .then(() => this.router.navigate(['/plan-mejoramiento']));
        },
        error: () => {
          this.alertService.showErrorAlert('Error al aprobar el plan de mejoramiento.');
        }
      });
    });
  }

  rechazar(): void {
    if (!this.todasRevisadas) {
      this.alertService.showAlert(
        'No se puede rechazar el plan',
        'Debe revisar todas las acciones de mejora antes de rechazar el plan.'
      );
      return;
    }
    if (!this.algunaRechazada) {
      this.alertService.showAlert(
        'No se puede rechazar el plan',
        'Para rechazar el plan, al menos una acción de mejora debe estar rechazada.'
      );
      return;
    }

    const dialogRef = this.dialog.open(ModalRechazoPlanComponent, {
      width: '600px',
      data: { planMejoramientoId: this.planMejoramientoId, usuarioId: this.usuarioId, role: this.role },
    });

    dialogRef.afterClosed().subscribe((rechazado: boolean) => {
      if (rechazado) {
        this.router.navigate(['/plan-mejoramiento']);
      }
    });
  }

  regresar(): void {
    this.router.navigate(['/plan-mejoramiento']);
  }
}
