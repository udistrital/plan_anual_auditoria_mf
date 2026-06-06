import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { RolService } from 'src/app/core/services/rol.service';
import { UserService } from 'src/app/core/services/user.service';
import { sumarDiasHabiles } from 'src/app/shared/utils/dias-habiles.util';
import { environment } from 'src/environments/environment';
import { Auditoria } from 'src/app/shared/data/models/auditoria';
import { MatDialog } from '@angular/material/dialog';
import { ModalVerDocumentoComponent } from 'src/app/shared/elements/components/dialogs/modal-ver-documento/modal-ver-documento.component';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-registrar-plan',
    templateUrl: './registrar-plan.component.html',
    styleUrls: ['./registrar-plan.component.css'],
    standalone: false
})
export class RegistrarPlanComponent implements OnInit {
  auditoriaId!: string;
  auditoria: Auditoria | null = null;
  planMejoramientoId: string | null = null;
  cargando = true;
  enviando = false;
  fuenteSeleccionada: number | null = null;

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
    private readonly dialog: MatDialog,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly alertService: AlertService,
    private readonly rolService: RolService,
    private readonly userService: UserService,
    private readonly planAnualAuditoriaMid: PlanAnualAuditoriaMid
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
    if (!this.planMejoramientoId || this.fuenteSeleccionada === null) return;
    this.planAuditoriaService
      .put(`plan-mejoramiento/${this.planMejoramientoId}`, { fuente: this.fuenteSeleccionada })
      .subscribe();
  }

  guardar(): void {
    this.guardarFuente();
    this.alertService.showSuccessAlert(
      'El plan de mejoramiento ha sido guardado.',
      'Guardado'
    );
  }

  enviarAuditor(): void {
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

  async verDocumento() {
    const documentoPlanMejoramiento = await this.obtenerDocumentoPlanMejoramiento();
    const dialogRef =  this.dialog.open(ModalVerDocumentoComponent, {
      width: "1000px",
      data: documentoPlanMejoramiento.Data,
      autoFocus: false
    })
  }

  private async obtenerDocumentoPlanMejoramiento() {
    try {
      const data = await firstValueFrom(this.planAnualAuditoriaMid.get(`plantilla/plan-mejoramiento/${this.auditoriaId}`));
      return data;
    } catch (error) {
      console.log("Error al cargar el documento de plan de mejoramiento.");
      this.alertService.showErrorAlert("No fue obtener el plan de mejoramiento.")
      return null;
    }
  }
}
