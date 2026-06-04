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
  styleUrls: ['./ver-plan.component.css'],
  standalone: false,
})
export class VerPlanComponent implements OnInit {
  auditoriaId!: string;
  planMejoramientoId!: string;
  auditoria: any = null;
  cargando = true;
  estadoPlanId: number | null = null;

  private role: string | null = null;
  private usuarioId = 0;

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
    // Aprobar/Rechazar solo cuando el plan está pendiente de revisión del auditor.
    if (this.estadoPlanId !== environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.REVISION_PLAN_MEJORAMIENTO_AUDITOR) {
      return false;
    }
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
            this.estadoPlanId = plan.estado_id ?? null;
            this.fuenteNombre = this.fuentes[plan.fuente] ?? '';
          }
          this.cargando = false;
        },
        error: () => { this.cargando = false; }
      });
  }

  aprobar(): void {
    if (!this.mostrarAccionesRevision()) return;
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
    if (!this.mostrarAccionesRevision()) return;
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
