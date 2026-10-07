import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { RolService } from 'src/app/core/services/rol.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';
import { ModalVerDocumentoComponent } from 'src/app/shared/elements/components/dialogs/modal-ver-documento/modal-ver-documento.component';
import { DatosModalRechazoPlan, ModalRechazoPlanComponent } from '../ tabla-plan-mejoramiento/modal-rechazo-plan/modal-rechazo-plan.component';
import { DatosModalAprobacionPlan, ModalAprobacionPlanComponent } from './modal-aprobacion-plan/modal-aprobacion-plan.component';
import { DocumentosAuditoriaPlanService } from '../../../services/documentos-auditoria-plan.service';

const ESTADO_PLAN = environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO;

// Nombre del estado del plan para el chip del encabezado
const NOMBRES_ESTADO_PLAN: Record<number, string> = {
  [ESTADO_PLAN.SIN_PLAN_MEJORAMIENTO]:              'Sin plan de mejoramiento',
  [ESTADO_PLAN.CREANDO_PLAN_MEJORAMIENTO]:          'En formulación',
  [ESTADO_PLAN.REVISION_PLAN_MEJORAMIENTO_AUDITOR]: 'En revisión del auditor',
  [ESTADO_PLAN.APROBADO_PLAN_MEJORAMIENTO]:         'Aprobado',
  [ESTADO_PLAN.RECHAZADO_PLAN_MEJORAMIENTO]:        'Devuelto con observaciones',
  [ESTADO_PLAN.FIN_PLAN_MEJORAMIENTO]:              'Finalizado',
};

@Component({
  selector: 'app-ver-plan',
  templateUrl: './ver-plan.component.html',
  styleUrls: ['../vista-plan.css', './ver-plan.component.css'],
  standalone: false,
})
export class VerPlanComponent implements OnInit {
  auditoriaId!: string;
  planMejoramientoId!: string;
  auditoria: any = null;
  cargando = true;
  estadoPlanId: number | null = null;

  planEstadoId: number | null = null;
  /** Estado y hallazgo de cada acción de mejora del plan (para validar la decisión y el avance) */
  accionesPlan: { estadoId: number; hallazgoId: string }[] = [];
  /** Auditor(es) asignados al plan */
  auditoresPlan = '';
  mostrarInformacion = true;

  get estadosAcciones(): number[] {
    return this.accionesPlan.map(a => a.estadoId);
  }

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

  // ─── Encabezado y avance del dictamen ────────────────────────────────────────

  get titulo(): string {
    return this.modoRevision ? 'Revisión y Evaluación del Plan de Mejoramiento' : 'Ver Plan de Mejoramiento';
  }

  get breadcrumb(): string {
    return `<p>Planes de Mejoramiento / <b>${this.titulo}</b></p>`;
  }

  get estadoPlanNombre(): string {
    return this.planEstadoId === null ? '' : (NOMBRES_ESTADO_PLAN[this.planEstadoId] ?? '');
  }

  get expediente(): string {
    return this.auditoria?.consecutivo_OCI || String(this.auditoria?.consecutivo_no_auditoria ?? '');
  }

  get dependenciasAuditadas(): string {
    return (this.auditoria?.dependencia_nombre ?? []).filter(Boolean).join(', ');
  }

  get procesoResponsable(): string {
    const proceso = this.auditoria?.proceso_nombre;
    return Array.isArray(proceso) ? proceso.filter(Boolean).join(', ') : (proceso ?? '');
  }

  get totalAcciones(): number {
    return this.accionesPlan.length;
  }

  get accionesAprobadas(): number {
    return this.estadosAcciones.filter(e => e === this.ESTADO_ACCION.APROBADA).length;
  }

  get accionesRechazadas(): number {
    return this.estadosAcciones.filter(e => e === this.ESTADO_ACCION.RECHAZADA).length;
  }

  get accionesPendientes(): number {
    return this.totalAcciones - this.accionesAprobadas - this.accionesRechazadas;
  }

  get porcentajeDictamen(): number {
    if (!this.totalAcciones) return 0;
    return Math.round(((this.totalAcciones - this.accionesPendientes) / this.totalAcciones) * 100);
  }

  get totalHallazgosConAcciones(): number {
    return new Set(this.accionesPlan.map(a => a.hallazgoId)).size;
  }

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
    private readonly documentosAuditoriaPlan: DocumentosAuditoriaPlanService,
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
            this.estadoPlanId = plan.estado_id ?? null;
            this.fuenteNombre = this.fuentes[plan.fuente] ?? '';
            this.cargarEstadosAcciones();
            this.cargarAuditoresPlan();
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
      // Consulta liviana de todo el plan (la tabla está paginada): solo estado y hallazgo
      .get(`accion-mejora?query=plan_mejoramiento_id:${this.planMejoramientoId},activo:true&limit=0&fields=estado_id,hallazgo_id`)
      .subscribe({
        next: (res) => {
          this.accionesPlan = (res?.Data ?? []).map((a: any) => ({
            estadoId:   a.estado_id ?? this.ESTADO_ACCION.PENDIENTE_REVISION,
            hallazgoId: typeof a.hallazgo_id === 'object' ? a.hallazgo_id?._id : a.hallazgo_id,
          }));
        },
        error: () => { this.accionesPlan = []; }
      });
  }

  private cargarAuditoresPlan(): void {
    this.planAuditoriaMid
      .get(`plan-mejoramiento-auditor?query=plan_mejoramiento_id:${this.planMejoramientoId},activo:true`)
      .subscribe({
        next: (res) => {
          this.auditoresPlan = (res?.Data ?? [])
            .map((a: any) => a.auditor_nombre)
            .filter(Boolean)
            .join(', ');
        },
        error: () => { this.auditoresPlan = ''; }
      });
  }

  verExpediente(): void {
    if (!this.auditoria) return;
    this.documentosAuditoriaPlan.verDocumentosAuditoria(this.auditoria);
  }

  // Formato del plan de mejoramiento (PDF) en solo lectura
  verFormato(): void {
    this.planAuditoriaMid.get(`plantilla/plan-mejoramiento/${this.auditoriaId}`).subscribe({
      next: (res: any) => {
        const documentoBase64 = res?.Data;
        if (!documentoBase64) {
          this.alertService.showErrorAlert('No fue posible generar el formato del plan de mejoramiento.');
          return;
        }
        this.dialog.open(ModalVerDocumentoComponent, {
          width: '1000px',
          data: documentoBase64,
          autoFocus: false,
        });
      },
      error: () => {
        this.alertService.showErrorAlert('No fue posible generar el formato del plan de mejoramiento.');
      }
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

    const data: DatosModalAprobacionPlan = {
      expediente:     this.expediente,
      totalAcciones:  this.totalAcciones,
      totalHallazgos: this.totalHallazgosConAcciones,
    };

    this.dialog.open(ModalAprobacionPlanComponent, { width: '700px', data }).afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;

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

    const data: DatosModalRechazoPlan = {
      planMejoramientoId: this.planMejoramientoId,
      usuarioId:          this.usuarioId,
      role:               this.role,
      expediente:         this.expediente,
      dependencias:       this.dependenciasAuditadas,
      accionesRechazadas: this.accionesRechazadas,
    };

    const dialogRef = this.dialog.open(ModalRechazoPlanComponent, { width: '700px', data });

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
