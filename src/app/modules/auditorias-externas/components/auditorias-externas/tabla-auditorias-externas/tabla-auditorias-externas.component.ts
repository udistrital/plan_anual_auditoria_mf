import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { Router } from "@angular/router";
import { AuditoriaExterna } from "src/app/shared/data/models/auditoria-externa";
import { AlertService } from "src/app/shared/services/alert.service";
import { AuditoriaExternaService } from "../../../services/auditoria-externa.service";
import { colocacionesContructorTabla } from "./tabla-auditorias-externas.utilidades";

/** Listado de auditorías externas registradas (#953), paginado en el servidor. */
@Component({
    selector: "app-tabla-auditorias-externas",
    templateUrl: "./tabla-auditorias-externas.component.html",
    styleUrls: ["../../../vista-externa.css", "./tabla-auditorias-externas.component.css"],
    standalone: false
})
export class TablaAuditoriasExternasComponent implements OnInit, OnChanges {
  /** Vigencia elegida en la pantalla (null = todas). */
  @Input() vigenciaId: number | null = null;
  /** Informa cuántas auditorías trae el listado (para el resumen de la pantalla). */
  @Output() totalCambio = new EventEmitter<number>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  auditoriasDataSource: MatTableDataSource<AuditoriaExterna> = new MatTableDataSource<AuditoriaExterna>();
  auditoriasContructorTabla = colocacionesContructorTabla;
  tablaColumnas: string[] = this.auditoriasContructorTabla.map((c) => c.columnDef);
  cargando = true;
  totalRegistros = 0;
  pageSize = 5;
  pageIndex = 0;
  opcionesPagina: number[] = [5, 10, 25];
  iconosAccion = new Map<string, string>([["Ver Auditoria", "visibility"]]);
  readonly acciones = ["Ver Auditoria"];

  constructor(
    private readonly router: Router,
    private readonly auditoriaExternaService: AuditoriaExternaService,
    private readonly alertaService: AlertService,
  ) { }

  ngOnInit() {
    void this.cargarAuditorias();
  }

  ngOnChanges(cambios: SimpleChanges) {
    // La primera carga la hace ngOnInit
    if (cambios["vigenciaId"] && !cambios["vigenciaId"].firstChange) {
      this.pageIndex = 0;
      void this.cargarAuditorias();
    }
  }

  async cargarAuditorias() {
    this.cargando = true;
    try {
      const { auditorias, total } = await this.auditoriaExternaService.listar(
        this.vigenciaId,
        this.pageSize,
        this.pageIndex * this.pageSize,
      );
      this.auditoriasDataSource = new MatTableDataSource(auditorias);
      this.totalRegistros = total;
      this.totalCambio.emit(total);
    } catch {
      this.auditoriasDataSource = new MatTableDataSource<AuditoriaExterna>();
      this.totalRegistros = 0;
      this.totalCambio.emit(0);
      this.alertaService.showErrorAlert("No fue posible cargar las auditorías externas.");
    } finally {
      this.cargando = false;
    }
  }

  manejarCambioPaginado(evento: PageEvent) {
    this.pageSize = evento.pageSize;
    this.pageIndex = evento.pageIndex;
    void this.cargarAuditorias();
  }

  getIconoAccion(accion: string): string {
    return this.iconosAccion.get(accion) ?? "help";
  }

  realizarAccion(auditoria: AuditoriaExterna, accion: string) {
    const acciones: Record<string, () => void> = {
      "Ver Auditoria": () => this.verAuditoria(auditoria),
    };
    acciones[accion]?.();
  }

  /** Desde el estado vacío: abre el registro con la vigencia elegida, si la hay. */
  registrarAuditoria() {
    this.router.navigate(["/auditorias-externas/registrar-auditoria"], {
      queryParams: this.vigenciaId ? { vigencia: this.vigenciaId } : {},
    });
  }

  verAuditoria(auditoria: AuditoriaExterna) {
    this.router.navigate([`/auditorias-externas/ver-auditoria/${auditoria._id}`]);
  }
}
