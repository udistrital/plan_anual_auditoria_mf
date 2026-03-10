import { AfterViewInit, Component, Input, OnInit, ViewChild } from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { Auditoria } from "src/app/shared/data/models/auditoria";
import { RolService } from "src/app/core/services/rol.service";
import { accionesEjecucionPreliminar } from "src/app/shared/utils/accionesPorRolYEstado";
import { colocacionesContructorTabla } from "./tabla-auditorias-externas.utilidades";
import { Router } from "@angular/router";

@Component({
  selector: "app-tabla-auditorias-externas",
  templateUrl: "./tabla-auditorias-externas.component.html",
  styleUrls: ["./tabla-auditorias-externas.component.css"],
})
export class TablaAuditoriasExternasComponent implements OnInit, AfterViewInit {
  @Input() vigenciaId: any;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  auditoriasDataSource: MatTableDataSource<any> = new MatTableDataSource();
  auditoriasContructorTabla: any;
  banderaTablaAuditoriasExternas: boolean = false;
  tablaColumnas: any;
  roles: string[] = [];
  totalRegistros: number = 0;
  pageSize: number = 5;
  pageIndex: number = 0;
  opcionesPagina: number[] = [5, 10, 25];
  mostrarAcciones: boolean = false;
  iconosAccion = new Map<string, string>([["Editar Auditoria", "edit_note"]]);

  auditoriasPorVigencia: Auditoria[] = [
    {
      _id: "1",
      plan_auditoria_id: "plan-001",
      titulo: "Auditoría Financiera",
      tipo_evaluacion_id: 1,
      cronograma_id: [1],
      estado_id: 1,
      no_auditoria: 1,
      vigencia_id: 2025,
      consecutivo_OCI: "OCI-001",
      consecutivo_IE: "IE-001",
      macroproceso_id: 1,
      proceso_id: 1,
      dependencia_id: 1,
      jefe_nombre: 1,
      asistente_nombre: 2,
      fecha_inicio: "2025-01-10",
      fecha_fin: "2025-01-20",
      objetivo: "Evaluar procesos financieros",
      alcance: "Área financiera",
      criterio: "Normativa vigente",
      rec_tecnologico: "Computador",
      rec_humano: "Equipo auditor",
      rec_fisico: "Oficina",
      temas: "Finanzas",
      activo: true,
      fecha_creacion: "2025-01-01",
      fecha_modificacion: "2025-01-02",
      tipo_evaluacion_nombre: "Externa",
      cronograma_nombre: ["Q1"],
      estado_nombre: "Aprobada",
      tipo_nombre: "Financiera",
      vigencia_nombre: "2025",
      macroproceso_nombre: "Gestión Financiera",
      proceso_nombre: "Control Financiero",
      dependencia_nombre: "Finanzas"
    },
    {
      _id: "2",
      plan_auditoria_id: "plan-002",
      titulo: "Auditoría de Cumplimiento",
      tipo_evaluacion_id: 2,
      cronograma_id: [2],
      estado_id: 1,
      no_auditoria: 2,
      vigencia_id: 2025,
      consecutivo_OCI: "OCI-002",
      consecutivo_IE: "IE-002",
      macroproceso_id: 2,
      proceso_id: 2,
      dependencia_id: 2,
      jefe_nombre: 3,
      asistente_nombre: 4,
      fecha_inicio: "2025-02-01",
      fecha_fin: "2025-02-15",
      objetivo: "Verificar cumplimiento",
      alcance: "Área administrativa",
      criterio: "Políticas internas",
      rec_tecnologico: "Sistema documental",
      rec_humano: "Auditor líder",
      rec_fisico: "Sala auditoría",
      temas: "Cumplimiento",
      activo: true,
      fecha_creacion: "2025-01-05",
      fecha_modificacion: "2025-01-06",
      tipo_evaluacion_nombre: "Externa",
      cronograma_nombre: ["Q2"],
      estado_nombre: "Aprobada",
      tipo_nombre: "Cumplimiento",
      vigencia_nombre: "2025",
      macroproceso_nombre: "Gestión Administrativa",
      proceso_nombre: "Control Interno",
      dependencia_nombre: "Secretaría General"
    }
  ];

  constructor(
    private rolService: RolService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.roles = this.rolService.getRoles();
    this.setPermisos();
    this.cargarPlanesAuditoria();
  }

  ngAfterViewInit() {
    this.auditoriasDataSource.paginator = this.paginator;
    this.auditoriasDataSource.sort = this.sort;
  }

  setPermisos() {
    if (this.rolService.mostrarAcciones(accionesEjecucionPreliminar)) {
      this.mostrarAcciones = true;
    }
  }

  cargarPlanesAuditoria() {
    const auditorias = this.auditoriasPorVigencia.map((auditoria) => ({
      ...auditoria,
      acciones: ["Editar Auditoria"],
    }));

    this.auditoriasDataSource = new MatTableDataSource(auditorias);

    this.auditoriasContructorTabla = colocacionesContructorTabla;
    this.tablaColumnas = this.auditoriasContructorTabla.map((c: any) => c.columnDef);

    this.totalRegistros = this.auditoriasPorVigencia.length;
    this.banderaTablaAuditoriasExternas = true;
  }

  manejarCambioPaginado(evento: PageEvent) {
    this.pageSize = evento.pageSize;
    this.pageIndex = evento.pageIndex;
  }

  getAccionesPorRolYEstado(estado: number) {
    return Array.from(
      new Set(
        this.roles.flatMap((rol) => accionesEjecucionPreliminar[rol]?.[estado] || [])
      )
    );
  }

  getIconoAccion(accion: string): string {
    return this.iconosAccion.get(accion) ?? "help";
  }

  realizarAccion(auditoria: any, accion: string) {
    const acciones: Record<string, Function | null> = {
      "Editar Auditoria": () => this.editarAuditoria(auditoria),
    };
    acciones[accion]?.();
  }

  editarAuditoria(auditoria: Auditoria) {
    const auditoriaId = auditoria._id;
    this.router.navigate([`/auditorias-externas/editar-auditoria/${auditoriaId}`]);
  }
}
