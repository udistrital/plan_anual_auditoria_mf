import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { RolService } from 'src/app/core/services/rol.service';
import { UserService } from 'src/app/core/services/user.service';
import { ParametrosUtilsService, Parametro } from 'src/app/shared/services/parametros.service';
import { esDiaHabil, sumarDiasHabiles } from 'src/app/shared/utils/dias-habiles.util';
import { environment } from 'src/environments/environment';
import { Auditoria } from 'src/app/shared/data/models/auditoria';
import { MatDialog } from '@angular/material/dialog';
import { ModalVerDocumentoComponent } from 'src/app/shared/elements/components/dialogs/modal-ver-documento/modal-ver-documento.component';
import { catchError, firstValueFrom, forkJoin, of, switchMap } from 'rxjs';
import { NuxeoService } from 'src/app/core/services/nuxeo.service';
import { ReferenciaPdfService } from 'src/app/core/services/referencia-pdf.service';

@Component({
    selector: 'app-registrar-plan',
    templateUrl: './registrar-plan.component.html',
    styleUrls: ['../../vista-plan.css', './registrar-plan.component.css'],
    standalone: false
})
export class RegistrarPlanComponent implements OnInit {
  auditoriaId!: string;
  auditoria: Auditoria | null = null;
  planMejoramientoId: string | null = null;
  cargando = true;
  enviando = false;
  soloLectura = false;
  fuenteSeleccionada: number | null = null;
  fuentes: Parametro[] = [];

  // Encabezado y resumen de la formulación (todo el plan, no solo la página de la tabla)
  estadoPlanId: number | null = null;
  fechaLimite: string | null = null;
  auditoresPlan = '';
  mostrarInformacion = true;
  totalHallazgos = 0;
  hallazgosFormulados = 0;
  /** Número de los hallazgos que aún no tienen acciones */
  hallazgosPendientes: string[] = [];

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

  get titulo(): string {
    return this.soloLectura ? 'Ver Plan de Mejoramiento' : 'Editar Plan de Mejoramiento';
  }

  get breadcrumb(): string {
    return this.soloLectura
      ? '<p>Planes de Mejoramiento / <b>Ver Plan de Mejoramiento</b></p>'
      : '<p>Planes de Mejoramiento / Registrar Plan / <b>Editar Plan de Mejoramiento</b></p>';
  }

  get estadoPlanNombre(): string {
    const estados = environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO;
    const nombres: Record<number, string> = {
      [estados.SIN_PLAN_MEJORAMIENTO]:              'Sin plan de mejoramiento',
      [estados.CREANDO_PLAN_MEJORAMIENTO]:          'En formulación',
      [estados.REVISION_PLAN_MEJORAMIENTO_AUDITOR]: 'En revisión del auditor',
      [estados.APROBADO_PLAN_MEJORAMIENTO]:         'Aprobado',
      [estados.RECHAZADO_PLAN_MEJORAMIENTO]:        'Devuelto con observaciones',
      [estados.FIN_PLAN_MEJORAMIENTO]:              'Finalizado',
    };
    return this.estadoPlanId === null ? '' : (nombres[this.estadoPlanId] ?? '');
  }

  get planDevuelto(): boolean {
    return this.estadoPlanId === environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.RECHAZADO_PLAN_MEJORAMIENTO;
  }

  get dependenciasAuditadas(): string {
    return (this.auditoria?.dependencia_nombre ?? []).filter(Boolean).join(', ');
  }

  get procesoResponsable(): string {
    const proceso: any = this.auditoria?.proceso_nombre;
    return Array.isArray(proceso) ? proceso.filter(Boolean).join(', ') : (proceso ?? '');
  }

  get porcentajeFormulacion(): number {
    return this.totalHallazgos ? Math.round((this.hallazgosFormulados / this.totalHallazgos) * 100) : 0;
  }

  /** Días hábiles que faltan para la fecha límite de formulación (negativo = vencido) */
  get diasHabilesRestantes(): number | null {
    if (!this.fechaLimite) return null;
    const limite = new Date(this.fechaLimite);
    if (isNaN(limite.getTime())) return null;
    const hoy = new Date();
    const actual = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const fin = new Date(limite.getFullYear(), limite.getMonth(), limite.getDate());
    if (actual > fin) return -1;
    let dias = 0;
    while (actual < fin) {
      actual.setDate(actual.getDate() + 1);
      if (esDiaHabil(actual)) dias++;
    }
    return dias;
  }

  get mensajeBarra(): string {
    if (this.hallazgosPendientes.length) {
      const lista = this.hallazgosPendientes.slice(0, 5).join(', ');
      const resto = this.hallazgosPendientes.length > 5 ? '…' : '';
      return `Modo de edición activo. Recuerde formular acciones para el/los hallazgo(s) ${lista}${resto} antes de enviar al auditor.`;
    }
    return 'Modo de edición activo. Todos los hallazgos tienen acciones formuladas; puede enviar el plan al auditor.';
  }

  private usuarioId = 0;
  private role: string | null = null;

  constructor(
    private readonly dialog: MatDialog,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly alertaService: AlertService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly alertService: AlertService,
    private readonly rolService: RolService,
    private readonly userService: UserService,
    private readonly planAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly parametrosUtilsService: ParametrosUtilsService,
    private readonly nuxeoService: NuxeoService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.soloLectura = this.route.snapshot.queryParamMap.get('soloLectura') === 'true';
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
    this.parametrosUtilsService.getFuentesPlanMejoramiento().subscribe({
      next: (data) => { this.fuentes = data; },
    });
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
            this.estadoPlanId = plan.estado_id ?? null;
            this.fechaLimite = plan.fecha_limite ?? null;
            this.cargarDatosEncabezado();

            if (!plan.fecha_apertura) {
              // Cascarón creado automáticamente: completar fechas y registrar estado 7082
              const fechaApertura = new Date();
              const fechaLimite = sumarDiasHabiles(fechaApertura, 8).toISOString();
              this.fechaLimite = fechaLimite;
              this.planAuditoriaService
                .put(`plan-mejoramiento/${plan._id}`, {
                  fecha_apertura: fechaApertura.toISOString(),
                  fecha_limite:   fechaLimite,
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
        this.fechaLimite = body.fecha_limite;
        this.cargarDatosEncabezado();
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
      next: () => {
        this.estadoPlanId = environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.CREANDO_PLAN_MEJORAMIENTO;
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  private cargarDatosEncabezado(): void {
    this.cargarAuditoresPlan();
    this.cargarResumenFormulacion();
  }

  private cargarAuditoresPlan(): void {
    if (!this.planMejoramientoId) return;
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

  /**
   * Resumen de la formulación de todo el plan (la tabla está paginada):
   * consultas livianas de hallazgos y acciones con solo los campos necesarios.
   */
  cargarResumenFormulacion(): void {
    if (!this.planMejoramientoId) return;
    this.planAuditoriaService
      .get(`informe?query=auditoria_id:${this.auditoriaId},activo:true&fields=_id`)
      .pipe(
        switchMap((resInforme) => {
          const informeId = resInforme?.Data?.[0]?._id;
          if (!informeId) return of({ hallazgos: [] as any[], acciones: [] as any[] });
          return forkJoin({
            hallazgos: this.planAuditoriaService
              .get(`hallazgo?query=informe_id:${informeId},activo:true&limit=0&fields=_id,no_hallazgo&sortby=_id&order=asc`),
            acciones: this.planAuditoriaService
              .get(`accion-mejora?query=plan_mejoramiento_id:${this.planMejoramientoId},activo:true&limit=0&fields=hallazgo_id`),
          }).pipe(switchMap(({ hallazgos, acciones }) => of({
            hallazgos: hallazgos?.Data ?? [],
            acciones:  acciones?.Data ?? [],
          })));
        }),
        catchError(() => of({ hallazgos: [] as any[], acciones: [] as any[] }))
      )
      .subscribe(({ hallazgos, acciones }) => {
        const conAcciones = new Set(acciones.map((a: any) =>
          typeof a.hallazgo_id === 'object' ? a.hallazgo_id?._id : a.hallazgo_id));
        // Mismo número que muestra la tabla (no_hallazgo o la posición en el orden por _id)
        const numerados: { id: string; numero: string }[] = hallazgos.map((h: any, i: number) => ({ id: h._id, numero: h.no_hallazgo ?? String(i + 1) }));
        this.totalHallazgos = numerados.length;
        this.hallazgosFormulados = numerados.filter(h => conAcciones.has(h.id)).length;
        this.hallazgosPendientes = numerados.filter(h => !conAcciones.has(h.id)).map(h => h.numero);
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

  verPlanMejoramiento(): void {
    this.planAnualAuditoriaMid.get(`plantilla/plan-mejoramiento/${this.auditoriaId}`).subscribe({
      next: (res: any) => {
        const documentoBase64 = res?.Data;

        if (!documentoBase64) {
          this.alertaService.showErrorAlert("No fue posible generar el plan de mejoramiento.");
          return;
        }

        this.verDocumento(documentoBase64, {
          nombre: "Plan de mejoramiento",
          plantilla: "plan-mejoramiento",
          parametro: environment.TIPO_DOCUMENTO_PARAMETROS.PLAN_MEJORAMIENTO
        });
      }
    })
  }

  verDocumento(documentoBase64: any, infoDocumento: any) {
    const dialogRef =  this.dialog.open(ModalVerDocumentoComponent, {
      width: "1000px",
      data: documentoBase64,
      autoFocus: false
    })

    const modalInstance = dialogRef.componentInstance;
    if (!this.soloLectura) {
      modalInstance.botonGuardar = { icono: "save", texto: "Guardar documento" };
    }

    dialogRef.afterClosed().subscribe((res) => {
      if (!res) return;

      if (res.accion === "guardarDocumento") {
        this.guardarDocumento(documentoBase64, infoDocumento);
      }
    });
  }

  guardarDocumento(documentoBase64: any, infoDocumento: any) {
    if (documentoBase64 !== "") {
      const payload = {
        IdTipoDocumento: environment.TIPO_DOCUMENTO.PLAN_MEJORAMIENTO,
        nombre: infoDocumento.nombre,
        descripcion:
          "Documento pdf (" +
          infoDocumento.plantilla +
          ") de Auditoria " + this.auditoriaId,
        metadatos: {},
        file: documentoBase64,
      };

      this.nuxeoService.guardarArchivos([payload]).subscribe({
        next: (response: any) => {
          const documentoRefNuxeo = response[0];

          this.guardarReferencia(
            documentoRefNuxeo,
            "Auditoria",
            this.auditoriaId,
            infoDocumento.parametro
          );
        },
        error: (error: any) => {
          console.error("Error al subir el documento", error);
        },
      });
    }
  }

  guardarReferencia(
    nuxeoResponse: any,
    referencia_tipo: string,
    referencia_id: string,
    tipo_id: number,
    metadatos?: Record<string, any>,
    onSuccess?: () => void
  ): void {
    if (nuxeoResponse.res.Enlace) {
      this.referenciaPdfService
        .guardarReferencia(
          nuxeoResponse.res,
          referencia_tipo,
          referencia_id,
          tipo_id,
          metadatos
        )
        .subscribe({
          next: () => {
            this.alertaService.showSuccessAlert("Archivo subido exitosamente.");
            onSuccess?.();
          },
          error: (error: any) => {
            console.error("Error al guardar la referencia", error);
          },
        });
    }
  }
}
