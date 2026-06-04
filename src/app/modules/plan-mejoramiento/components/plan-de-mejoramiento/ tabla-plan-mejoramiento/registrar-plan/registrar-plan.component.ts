import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { RolService } from 'src/app/core/services/rol.service';
import { UserService } from 'src/app/core/services/user.service';
import { sumarDiasHabiles } from 'src/app/shared/utils/dias-habiles.util';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-registrar-plan',
    templateUrl: './registrar-plan.component.html',
    styleUrls: ['./registrar-plan.component.css'],
    standalone: false
})
export class RegistrarPlanComponent implements OnInit {
  auditoriaId!: string;
  auditoria: any = null;
  planMejoramientoId: string | null = null;
  cargando = true;
  enviando = false;
  soloLectura = false;
  fuenteSeleccionada: number | null = null;

  /** Estados en los que el plan aún puede editarse (registrar/editar acciones). */
  private readonly estadosEditables: number[] = [
    environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.SIN_PLAN_MEJORAMIENTO,
    environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.CREANDO_PLAN_MEJORAMIENTO,
    environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.RECHAZADO_PLAN_MEJORAMIENTO,
  ];

  get lideresDelProceso(): string {
    return (this.auditoria?.datos_dependencias ?? [])
      .map((d: any) => d.jefe_nombre).filter(Boolean).join(', ') || '';
  }

  get gestoresDelProceso(): string {
    return (this.auditoria?.datos_dependencias ?? [])
      .map((d: any) => d.dependencia_nombre).filter(Boolean).join(', ') || '';
  }

  readonly fuentes = [
    { id: 1, nombre: 'Auditoría Interna' },
    { id: 2, nombre: 'Auditoría Externa' },
    { id: 3, nombre: 'Producto/Servicio No Conforme' },
    { id: 4, nombre: 'Quejas, reclamos o sugerencias' },
    { id: 5, nombre: 'Revisión por la Dirección' },
    { id: 6, nombre: 'Evaluación del desempeño' },
    { id: 7, nombre: 'Mejoramiento Continuo' },
  ];

  private usuarioId = 0;
  private role: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
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
      environment.ROL.JEFE_DEPENDENCIA,
      environment.ROL.ASISTENTE_DEPENDENCIA,
    ]);
    this.usuarioId = await this.userService.getPersonaId();
    this.cargarAuditoria();
  }

  cargarAuditoria(): void {
    this.planAuditoriaMid.get(`auditoria/${this.auditoriaId}`).subscribe({
      next: (res) => {
        this.auditoria = res.Data;
        this.resolverPlanMejoramiento();
      },
      error: () => { this.cargando = false; }
    });
  }

  private resolverPlanMejoramiento(): void {
    this.planAuditoriaService
      .get(`plan-mejoramiento?query=auditoria_id:${this.auditoriaId},activo:true`)
      .subscribe({
        next: (res) => {
          if (res?.Data?.length > 0) {
            const plan = res.Data[0];
            this.planMejoramientoId = plan._id;
            this.fuenteSeleccionada = plan.fuente ?? null;

            if (!plan.fecha_apertura) {
              // Cascarón creado automáticamente: completar fechas y registrar estado 7082
              const fechaApertura = new Date();
              this.planAuditoriaService
                .put(`plan-mejoramiento/${plan._id}`, {
                  fecha_apertura: fechaApertura.toISOString(),
                  fecha_limite:   sumarDiasHabiles(fechaApertura, 8).toISOString(),
                })
                .subscribe({
                  next: () => this.registrarEstadoInicial(plan._id),
                  error: () => { this.cargando = false; }
                });
            } else {
              this.soloLectura = !this.estadosEditables.includes(plan.estado_id);
              this.cargando = false;
            }
          } else {
            this.crearPlanMejoramiento();
          }
        },
        error: () => { this.cargando = false; }
      });
  }

  private crearPlanMejoramiento(): void {
    const fechaApertura = new Date();
    const body = {
      auditoria_id:       this.auditoriaId,
      vigencia_id:        this.auditoria?.vigencia_id,
      tipo_evaluacion_id: this.auditoria?.tipo_evaluacion_id,
      fecha_apertura:     fechaApertura.toISOString(),
      fecha_limite:       sumarDiasHabiles(fechaApertura, 8).toISOString(),
      estado_id:          environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.CREANDO_PLAN_MEJORAMIENTO,
      activo:             true,
    };

    this.planAuditoriaService.post('plan-mejoramiento', body).subscribe({
      next: (res: any) => {
        this.planMejoramientoId = res.Data._id;
        this.registrarEstadoInicial(res.Data._id);
      },
      error: () => {
        this.alertService.showErrorAlert('Error al crear el plan de mejoramiento.');
        this.cargando = false;
      }
    });
  }

  private registrarEstadoInicial(planId: string): void {
    const body = {
      plan_mejoramiento_id:   planId,
      usuario_id:             this.usuarioId,
      usuario_rol:            this.role,
      observacion:            'Plan de mejoramiento iniciado',
      estado_id:              environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.CREANDO_PLAN_MEJORAMIENTO,
      fase_id:                environment.AUDITORIA_FASE.PLAN_MEJORAMIENTO,
      fecha_ejecucion_estado: new Date().toISOString(),
      activo:                 true,
    };

    this.planAuditoriaService.post('plan-mejoramiento-estado', body).subscribe({
      next: () => { this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  guardarFuente(): void {
    if (this.soloLectura) return;
    if (!this.planMejoramientoId || this.fuenteSeleccionada === null) return;
    this.planAuditoriaService
      .put(`plan-mejoramiento/${this.planMejoramientoId}`, { fuente: this.fuenteSeleccionada })
      .subscribe();
  }

  guardar(): void {
    if (this.soloLectura) return;
    this.guardarFuente();
    this.alertService.showSuccessAlert(
      'El plan de mejoramiento ha sido guardado.',
      'Guardado'
    );
  }

  enviarAuditor(): void {
    if (this.soloLectura) return;
    if (!this.planMejoramientoId) return;

    this.planAuditoriaService
      .get(`plan-mejoramiento-auditor?query=plan_mejoramiento_id:${this.planMejoramientoId},activo:true`)
      .subscribe({
        next: (res) => {
          if (!(res?.Data?.length)) {
            this.alertService.showAlert(
              'Sin auditores asignados',
              'Debe asignar al menos un auditor responsable antes de enviar el plan a revisión.'
            );
            return;
          }
          this.ejecutarEnvioAuditor();
        },
      });
  }

  private ejecutarEnvioAuditor(): void {
    this.alertService.showConfirmAlert(
      '¿Enviar el plan al auditor para revisión?'
    ).then(conf => {
      if (!conf.value) return;

      this.enviando = true;
      const body = {
        plan_mejoramiento_id:   this.planMejoramientoId,
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
          this.enviando = false;
          this.alertService.showSuccessAlert(
            'El plan fue enviado al auditor para revisión.',
            'Enviado'
          ).then(() => this.router.navigate(['/plan-mejoramiento']));
        },
        error: () => {
          this.enviando = false;
          this.alertService.showErrorAlert('Error al enviar el plan al auditor.');
        }
      });
    });
  }

  regresar(): void {
    this.router.navigate(['/plan-mejoramiento']);
  }
}
