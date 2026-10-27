import { Component, OnInit } from "@angular/core";
import { RolService } from "src/app/core/services/rol.service";
import { VistaFormulacion, vistaPorRol } from "../formulacion-planes/formulacion-planes.component";

/** Elige la vista de Gestión de Acciones según el rol (misma tabla de roles que Formulación de Planes). */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { ParametrosUtilsService } from 'src/app/shared/services/parametros.service';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { Router, ActivatedRoute } from '@angular/router';
import { RolService } from 'src/app/core/services/rol.service';
import { environment } from 'src/environments/environment';

export interface FilaAccion {
  noAuditoria: string;
  nombreAuditoria: string;
  noHallazgo: string;
  noAccion: string;
  auditoresResponsablesPlan: string;
  dependenciaResponsable: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  accionId: string;
  planMejoramientoId: string;
}

@Component({
  selector: "app-gestion-acciones",
  templateUrl: "./gestion-acciones.component.html",
  standalone: false,
})
export class GestionAccionesComponent implements OnInit {
  rol: string | null = null;
  vista: VistaFormulacion | null = null;

  constructor(private readonly rolService: RolService) {}

  async ngOnInit(): Promise<void> {
    // La ruta no tiene AuthGuard y AppComponent no espera la carga de roles
    await this.rolService.cargarRoles();
    this.rol = this.rolService.getRolPrioritario(Object.keys(vistaPorRol));
    this.vista = this.rol ? vistaPorRol[this.rol] : null;
  constructor(
    private readonly fb: FormBuilder,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly parametrosUtilsService: ParametrosUtilsService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly rolService: RolService,
  ) {}

  ngOnInit(): void {
    this.iniciarForm();
    this.cargarVigencias();
  }

  private iniciarForm(): void {
    this.filtrosForm = this.fb.group({
      vigencia:              [null, Validators.required],
      noAuditoria:           [''],
      nombreAuditoria:       [''],
      noHallazgo:            [''],
      noAccion:              [''],
      auditorResponsable:    [''],
      dependenciaResponsable:[''],
      desde:                 [null],
      hasta:                 [null],
    });
  }

  private cargarVigencias(): void {
    this.parametrosUtilsService.getVigencias().subscribe({
      next: (data) => { this.vigencias = data; },
    });
  }

  onVigenciaChange(): void {
    // Al cambiar la vigencia se reinicia la paginación y se recarga
    this.pageIndex = 0;
    this.cargarAcciones();
  }

  aplicarFiltros(): void {
    this.pageIndex = 0;
    this.cargarAcciones();
  }

  limpiarFiltros(): void {
    this.filtrosForm.patchValue({
      noAuditoria: '', nombreAuditoria: '', noHallazgo: '', noAccion: '',
      auditorResponsable: '', dependenciaResponsable: '', desde: null, hasta: null,
    });
    this.pageIndex = 0;
    this.cargarAcciones();
  }

  manejarCambioPaginado(evento: PageEvent): void {
    this.pageIndex = evento.pageIndex;
    this.pageSize = evento.pageSize;
    this.cargarAcciones();
  }

  private cargarAcciones(): void {
    const vigenciaId = this.filtrosForm.get('vigencia')?.value;
    if (!vigenciaId) {
      this.dataSource.data = [];
      this.totalRegistros = 0;
      this.changeDetector.markForCheck();
      return;
    }

    this.cargando = true;
    this.planAuditoriaMid.get(`gestion-accion?${this.construirQuery(vigenciaId)}`).subscribe({
      next: (res) => {
        this.dataSource.data = this.mapearFilas(res?.Data ?? []);
        this.totalRegistros = res?.MetaData?.Count ?? this.dataSource.data.length;
        this.changeDetector.markForCheck();
        this.cargando = false;
      },
      error: () => {
        this.dataSource.data = [];
        this.totalRegistros = 0;
        this.changeDetector.markForCheck();
        this.cargando = false;
      },
    });
  }

  private construirQuery(vigenciaId: number): string {
    const v = this.filtrosForm.value;
    const ESTADO_PLAN = environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO;
    const params: Record<string, string> = {
      vigencia_id: String(vigenciaId),
      // El seguimiento de las acciones empieza cuando el plan está aprobado (y sigue visible al finalizar)
      estado_plan_id: `${ESTADO_PLAN.APROBADO_PLAN_MEJORAMIENTO}|${ESTADO_PLAN.FIN_PLAN_MEJORAMIENTO}`,
      limit: String(this.pageSize),
      offset: String(this.pageIndex * this.pageSize),
    };

    if (v.noAuditoria)            params['no_auditoria'] = v.noAuditoria.trim();
    if (v.nombreAuditoria)        params['nombre_auditoria'] = v.nombreAuditoria.trim();
    if (v.noHallazgo)             params['no_hallazgo'] = v.noHallazgo.trim();
    if (v.noAccion)               params['no_accion'] = v.noAccion.trim();
    if (v.auditorResponsable)     params['auditor'] = v.auditorResponsable.trim();
    if (v.dependenciaResponsable) params['dependencia'] = v.dependenciaResponsable.trim();
    if (v.desde)                  params['desde'] = new Date(v.desde).toISOString();
    if (v.hasta)                  params['hasta'] = new Date(v.hasta).toISOString();

    return new URLSearchParams(params).toString();
  }

  private mapearFilas(data: any[]): FilaAccion[] {
    return data.map((item) => ({
      accionId:                  item.accion_id ?? '',
      planMejoramientoId:        item.plan_mejoramiento_id ?? '',
      noAuditoria:               item.no_auditoria ?? '',
      nombreAuditoria:           item.nombre_auditoria ?? '',
      noHallazgo:                item.no_hallazgo ?? '',
      noAccion:                  item.no_accion ?? '',
      auditoresResponsablesPlan: item.auditores_responsables_plan ?? '',
      dependenciaResponsable:    item.dependencia_responsable ?? '',
      fechaInicio:               item.fecha_inicio
                                   ? new Date(item.fecha_inicio).toLocaleDateString('es-CO')
                                   : '',
      fechaFin:                  item.fecha_fin
                                   ? new Date(item.fecha_fin).toLocaleDateString('es-CO')
                                   : '',
      estado:                    item.estado_nombre ?? '',
    }));
  }

  exportarTabla(): void {
    // TODO: exportar a Excel/PDF
  }

  /** El auditor revisa y califica; el resto registra avances (la vista valida además la asignación al plan). */
  get esAuditor(): boolean {
    return this.rolService.permisoCreacion([environment.ROL.AUDITOR, environment.ROL.AUDITOR_EXPERTO]);
  }

  abrirAccion(fila: FilaAccion): void {
    const ruta = this.esAuditor ? 'revisar' : 'registrar-avances';
    this.router.navigate([`${ruta}/${fila.accionId}`], { relativeTo: this.route });
  }
}
