import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ParametrosUtilsService } from 'src/app/shared/services/parametros.service';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';

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

  readonly columnas = [
    'noAuditoria', 'nombreAuditoria', 'noHallazgo', 'noAccion',
    'auditoresResponsablesPlan', 'dependenciaResponsable',
    'fechaInicio', 'fechaFin', 'estado', 'acciones',
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly parametrosUtilsService: ParametrosUtilsService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
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
    const vigenciaId = this.filtrosForm.get('vigencia')?.value;
    if (!vigenciaId) return;
    this.cargarAcciones(vigenciaId);
  }

  private cargarAcciones(_vigenciaId: number): void {
    this.cargando = true;
    // TODO: llamar al MID para obtener acciones por vigencia
    // Ejemplo de llamada esperada:
    // this.planAuditoriaMid.get(`gestion-acciones?vigencia_id=${_vigenciaId}&limit=0`)
    //   .subscribe({
    //     next: (res) => { this.procesarAcciones(res.Data ?? []); this.cargando = false; },
    //     error: () => { this.cargando = false; },
    //   });
    this.cargando = false;
  }

  aplicarFiltros(): void {
    const v = this.filtrosForm.value;
    this.dataSource.filterPredicate = (row: FilaAccion) => {
      const matchNoAuditoria    = !v.noAuditoria         || row.noAuditoria.toLowerCase().includes(v.noAuditoria.toLowerCase());
      const matchNombre         = !v.nombreAuditoria     || row.nombreAuditoria.toLowerCase().includes(v.nombreAuditoria.toLowerCase());
      const matchNoHallazgo     = !v.noHallazgo          || row.noHallazgo.toLowerCase().includes(v.noHallazgo.toLowerCase());
      const matchNoAccion       = !v.noAccion            || row.noAccion.toLowerCase().includes(v.noAccion.toLowerCase());
      const matchAuditor        = !v.auditorResponsable  || row.auditoresResponsablesPlan.toLowerCase().includes(v.auditorResponsable.toLowerCase());
      const matchDependencia    = !v.dependenciaResponsable || row.dependenciaResponsable.toLowerCase().includes(v.dependenciaResponsable.toLowerCase());
      const fechaInicio         = row.fechaInicio ? new Date(row.fechaInicio) : null;
      const matchDesde          = !v.desde || (fechaInicio !== null && fechaInicio >= new Date(v.desde));
      const matchHasta          = !v.hasta || (fechaInicio !== null && fechaInicio <= new Date(v.hasta));
      return matchNoAuditoria && matchNombre && matchNoHallazgo && matchNoAccion
          && matchAuditor && matchDependencia && matchDesde && matchHasta;
    };
    this.dataSource.filter = Date.now().toString();
  }

  limpiarFiltros(): void {
    this.filtrosForm.patchValue({
      noAuditoria: '', nombreAuditoria: '', noHallazgo: '', noAccion: '',
      auditorResponsable: '', dependenciaResponsable: '', desde: null, hasta: null,
    });
    this.dataSource.filter = '';
  }

  exportarTabla(): void {
    // TODO: exportar a Excel/PDF
  }

  verActividades(_fila: FilaAccion): void {
    // TODO: navegar a la vista de seguimiento de la acción
  }
}
