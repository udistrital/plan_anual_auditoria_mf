import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { colocacionesContructorTabla } from "./tabla-auditorias-internas.utilidades";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { Auditoria } from "src/app/shared/data/models/auditoria";
import { AlertService } from "src/app/shared/services/alert.service";
import { RolService } from "src/app/core/services/rol.service";
import { accionesEjecucion } from "src/app/shared/utils/accionesPorRolYEstado";

@Component({
  selector: "app-tabla-auditorias-internas",
  templateUrl: "./tabla-auditorias-internas.component.html",
  styleUrls: ["./tabla-auditorias-internas.component.css"],
})
export class TablaAuditoriasInternasComponent implements OnInit {
  @Input() vigenciaId: any;
  @Input() role: any;
  @Input() personaId: any;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  auditoriasDataSource: MatTableDataSource<any> = new MatTableDataSource();
  auditoriasPorVigencia: Auditoria[] = [];
  auditoriasContructorTabla: any;
  banderaTablaAuditoriasInternas: boolean = false;
  tablaColumnas: any;
  roles: string[] = [];
  totalRegistros: number = 0;
  pageSize: number = 5;
  pageIndex: number = 0;
  itemsPerPage: number[] = [5, 10, 20];
  mostrarAcciones: boolean = false;
  iconosAccion = new Map<string, string>([
    ["Editar Preinforme", "edit_note"],
    ["Editar informe", "edit"],
    ["Ver Documentos del informe", "description"],
    ["Enviar a Aprobación por Jefe", "send"],
  ]);

  constructor(
    private alertaService: AlertService,
    private rolService: RolService,
    private changeDetector: ChangeDetectorRef,
    private dialog: MatDialog,
    private planAuditoriaMid: PlanAnualAuditoriaMid,
    private router: Router
  ) {}

  ngOnInit() {
    this.roles = this.rolService.getRoles();
    this.setPermisos();
  }

  setPermisos() {
    if (this.rolService.mostrarAcciones(accionesEjecucion)) {
      this.mostrarAcciones = true;
    }
  }

  listarAuditoriasPorVigencia(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0,
    estadoId?: number
  ) {
    this.auditoriasPorVigencia = [];
    
    let query = `vigencia_id:${vigenciaId},activo:true`;
    if (estadoId) {
      query += `,estado_id:${estadoId}`;
    }

    const endpoint = this.role === 'auditor' && this.personaId
      ? `auditoria/auditor/${this.personaId}?query=${query}&limit=${limit}&offset=${offset}&estado_id=${estadoId || ''}`
      : `auditoria?query=${query}&limit=${limit}&offset=${offset}`;

    this.planAuditoriaMid
      .get(endpoint)
      .subscribe((res) => {
        // const auditorias: any[] = res.Data.map((auditoria: any) => {
        //   const estadoId = auditoria.estado?.estado_interno_id;
        //   const acciones = this.getAccionesPorRolYEstado(estadoId);
        //   return { ...auditoria, acciones };
        // });

        // TODO: Descomentar la sección de arriba y quitar esta:
        const auditorias: any[] = res.Data.map((auditoria: any) => {
          const estadoId = auditoria.estado?.estado_interno_id;
          const acciones = this.getAccionesPorRolYEstado(estadoId).length > 0
            ? this.getAccionesPorRolYEstado(estadoId)
            : ["Editar Preinforme", "Editar informe", "Ver Documentos del informe", "Enviar a Aprobación por Jefe"];
          return { ...auditoria, acciones };
        });

        if (!(auditorias.length > 0)) {
          this.banderaTablaAuditoriasInternas = false;
          this.auditoriasDataSource.data = [];
          return this.alertaService.showAlert(
            "No hay auditorías registradas",
            "Actualmente no hay auditorías registradas para la vigencia seleccionada."
          );
        }

        this.auditoriasPorVigencia = auditorias;
        this.totalRegistros = res.MetaData.Count;
        this.banderaTablaAuditoriasInternas = true;
        this.construirTabla();
      });
  }

  construirTabla() {
    this.auditoriasContructorTabla = colocacionesContructorTabla.filter(
      (column) => {
        return column.columnDef !== "acciones" || this.mostrarAcciones;
      }
    );
    this.tablaColumnas = this.auditoriasContructorTabla.map(
      (column: any) => column.columnDef
    );

    this.auditoriasDataSource = new MatTableDataSource(
      this.auditoriasPorVigencia
    );

    //si no hay paginador, se crea
    if (!this.paginator) {
      this.auditoriasDataSource.paginator = this.paginator;
      this.auditoriasDataSource.sort = this.sort;
    }

    this.changeDetector.detectChanges();
  }

  manejarCambioPaginado(evento: PageEvent) {
    // Actualizar el índice de página y tamaño de página
    this.pageSize = evento.pageSize;
    this.pageIndex = evento.pageIndex;

    const offset = this.pageIndex * this.pageSize;
    this.listarAuditoriasPorVigencia(this.vigenciaId, this.pageSize, offset);
    // Actualizar el paginador después de realizar la consulta
    this.paginator.length = this.totalRegistros;
    this.paginator.pageSize = this.pageSize;
    this.paginator.pageIndex = this.pageIndex;
  }

  getAccionesPorRolYEstado(estado: number) {
    return Array.from(
      new Set(
        this.roles.flatMap((rol) => accionesEjecucion[rol]?.[estado] || [])
      )
    );
  }

  getIconoAccion(accion: string): string {
    return this.iconosAccion.get(accion) ?? "help";
  }

  realizarAccion(auditoria: any, accion: string) {
    const acciones: Record<string, Function | null> = {
      "Editar Preinforme": () => this.editarPreinforme(auditoria),
      "Editar informe": () => this.editarInforme(auditoria),
      "Ver Documentos del informe": () => this.verDocumentosInforme(auditoria),
      "Enviar a Aprobación por Jefe": () => this.enviarAprobacionPorJefe(auditoria),
    };
    acciones[accion]?.();
  }

  editarPreinforme(auditoria: Auditoria) {
    console.log("Editar Preinforme", auditoria);
  }

  editarInforme(auditoria: Auditoria) {
    const auditoriaId = auditoria._id;
    this.router.navigate([
      `/ejecucion/auditorias-internas/editar-informe/${auditoriaId}`, // TODO: Se deberia pasar auditoriaId o informeId?
    ]);
  }

  verDocumentosInforme(auditoria: Auditoria) {
    const auditoriaId = auditoria._id;
    this.router.navigate([
      `/ejecucion/auditorias-internas/revision/${auditoriaId}`,
    ]);
  }

  enviarAprobacionPorJefe(auditoria: Auditoria) {
    console.log("Enviar a Aprobación por Jefe", auditoria);
  }
}
