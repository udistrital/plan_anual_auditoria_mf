import { AfterViewInit, Component, Input, OnInit, ViewChild } from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { AuditoriaExterna } from "src/app/shared/data/models/auditoria-externa";
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

  auditoriasPorVigencia: AuditoriaExterna[] = [
    {
      _id: "1",
      vigencia_nombre: "2025",
      auditoria_nombre: "Auditoría Financiera",
      origen: "Plan Anual de Auditoría",
      auditores: [{"nombre": "Juan Pérez"}, {"nombre": "María Gómez"}],
      dependencia_nombre: "Dirección Financiera"
    },
    {
      _id: "2",
      vigencia_nombre: "2025",
      auditoria_nombre: "Auditoría de Cumplimiento",
      origen: "Plan Anual de Auditoría",
      auditores: [{"nombre": "Carlos López"}, {"nombre": "Ana Martínez"}],
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

  editarAuditoria(auditoria: AuditoriaExterna) {
    const auditoriaId = auditoria._id;
    this.router.navigate([`/auditorias-externas/editar-auditoria/${auditoriaId}`]);
  }
}
