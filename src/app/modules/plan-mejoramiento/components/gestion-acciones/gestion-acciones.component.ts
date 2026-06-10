import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { ParametrosUtilsService } from 'src/app/shared/services/parametros.service';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';

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
  selector: 'app-gestion-acciones',
  templateUrl: './gestion-acciones.component.html',
  styleUrls: ['./gestion-acciones.component.css'],
  standalone: false,
})
export class GestionAccionesComponent implements OnInit {
  filtrosForm!: FormGroup;
  vigencias: any[] = [];
  dataSource = new MatTableDataSource<FilaAccion>([]);
  cargando = false;

  // Paginación server-side
  totalRegistros = 0;
  pageSize = 10;
  pageIndex = 0;
  readonly pageSizeOptions = [5, 10, 25, 50];

  readonly columnas = [
    'noAuditoria', 'nombreAuditoria', 'noHallazgo', 'noAccion',
    'auditoresResponsablesPlan', 'dependenciaResponsable',
    'fechaInicio', 'fechaFin', 'estado', 'acciones',
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly parametrosUtilsService: ParametrosUtilsService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
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
      return;
    }

    this.cargando = true;
    this.planAuditoriaMid.get(`gestion-accion?${this.construirQuery(vigenciaId)}`).subscribe({
      next: (res) => {
        this.dataSource.data = this.mapearFilas(res?.Data ?? []);
        this.totalRegistros = res?.MetaData?.Count ?? this.dataSource.data.length;
        this.cargando = false;
      },
      error: () => {
        this.dataSource.data = [];
        this.totalRegistros = 0;
        this.cargando = false;
      },
    });
  }

  private construirQuery(vigenciaId: number): string {
    const v = this.filtrosForm.value;
    const params: Record<string, string> = {
      vigencia_id: String(vigenciaId),
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

  verActividades(_fila: FilaAccion): void {
    // TODO: navegar a la vista de seguimiento de la acción
  }
}
