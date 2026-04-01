import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/services/alert.service';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { Auditoria } from 'src/app/shared/data/models/auditoria';
import { Auditoria as AuditoriaAsignacion } from 'src/app/shared/data/models/auditoria-auditor';
import { Auditoria as AuditoriaPadreRequest } from 'src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria';
import { AddAuditoriaModalComponent } from "../../consulta-plan-auditoria/registrar-auditorias/add-auditoria-modal/add-auditoria-modal.component";
import { ModalAgregarAuditorComponent } from '../../asignar-auditorias/modal-agregar-auditor/modal-agregar-auditor.component';
import {
  AuditoriaEspecialTablaRow,
  colocacionesContructorTablaEspeciales,
} from "./tabla-auditorias-especiales.utilidades";
import { catchError, firstValueFrom, map, Observable, of } from 'rxjs';

@Component({
  selector: 'app-tabla-auditorias-especiales',
  templateUrl: './tabla-auditorias-especiales.component.html',
  styleUrl: './tabla-auditorias-especiales.component.css'
})
export class TablaAuditoriasEspecialesComponent {
  @Input() vigenciaId: number | null = null;
  @Input() permiso: boolean = false;
  @Input() usuarioId: number | null = null;
  @Input() usuarioRol: string = "";
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<AuditoriaEspecialTablaRow>([]);
  auditoriasContructorTabla: any;
  tablaColumnas: any;
  totalRegistros: number = 0;
  pageSize: number = 5;
  pageIndex: number = 0;
  itemsPerPage: number[] = [5, 10, 20];
  mostrarAcciones: boolean = false;
  banderaTabla: boolean = false;
  displayedColumns: string[] = [];

  constructor(
    private planAuditoriaMid: PlanAnualAuditoriaMid,
    private planAuditoriaService: PlanAnualAuditoriaService,
    private alertaService: AlertService,
    private dialog: MatDialog,
  ) {
    this.construirTabla();
  }

  construirTabla() {
    this.auditoriasContructorTabla = colocacionesContructorTablaEspeciales.filter(
      (column) => {
        return column.columnDef !== "acciones" || this.permiso;
      }
    );

    this.tablaColumnas = this.auditoriasContructorTabla.map(
      (column: any) => column.columnDef
    );
    this.displayedColumns = this.tablaColumnas;
  }

  cargarAuditorias(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0
  ): void {
    this.vigenciaId = vigenciaId;
    this.pageSize = limit;
    this.pageIndex = limit > 0 ? Math.floor(offset / limit) : 0;

    this.planAuditoriaMid
      .get(
        `auditoria-padre?query=vigencia_id:${vigenciaId},activo:true,plan_auditoria_id__isnull:true&limit=${limit}&offset=${offset}`
      ).subscribe({
        next: (res) => {
          if (!res?.Data) {
            this.totalRegistros = 0;
            this.dataSource.data = [];
            this.banderaTabla = false;
            return;
          }

          const auditoriasPadre: AuditoriaEspecialTablaRow[] = res.Data.map(
            (item: Auditoria, index: number): AuditoriaEspecialTablaRow => {
              const auditoriaId = item._id || "";
              return {
                numero: (offset + index + 1).toString(),
                _id: auditoriaId,
                titulo: item.titulo || "Sin Titulo",
                subtitulo: "",
                tipo_evaluacion_id: item.tipo_evaluacion_id || 0,
                tipo_evaluacion_nombre: item.tipo_evaluacion_nombre || "Sin Asignar",
                cronograma_id: item.cronograma_id || [],
                cronograma_nombre: item.cronograma_nombre || [],
                macroproceso_id: item.macroproceso_id || 0,
                proceso_id: item.proceso_id || 0,
                dependencia_id: item.dependencia_id || 0,
                estado_id: item.estado_id || 0,
                estado_nombre: item.estado_nombre || "Sin estado",
                cantidad_auditorias: item.cantidad_auditorias || 0,
                esAuditoriaConcreta: false,
                filaOculta: false,
                expandido: false,
              };
            }
          );

          this.dataSource.data = auditoriasPadre;
          this.banderaTabla = auditoriasPadre.length > 0;
          this.totalRegistros = res.MetaData?.Count || auditoriasPadre.length;
          this.construirTabla();

          if (this.paginator) {
            this.paginator.length = this.totalRegistros;
            this.paginator.pageSize = this.pageSize;
            this.paginator.pageIndex = this.pageIndex;
          }
        },
        error: (error) => {
          console.error("Error al cargar las auditorías:", error);
          this.alertaService.showErrorAlert("Error al cargar las auditorías");
        }
      });
  }

  editarAuditoria(auditoria?: AuditoriaEspecialTablaRow) {
    const auditoriaPadre: AuditoriaPadreRequest | undefined = auditoria
      ? {
          id: auditoria._id || "",
          auditoria: auditoria.titulo || "Sin Titulo",
          tipoEvaluacion: auditoria.tipo_evaluacion_nombre || "Sin Asignar",
          tipoEvaluacionId: auditoria.tipo_evaluacion_id || 0,
          macroproceso: auditoria.macroproceso_nombre || "",
          macroprocesoId: auditoria.macroproceso_id || 0,
          proceso: auditoria.proceso_nombre || "",
          procesoId: auditoria.proceso_id || 0,
          dependencia: auditoria.dependencia_nombre || "",
          dependenciaId: auditoria.dependencia_id || 0,
          cronograma: auditoria.cronograma_nombre?.join(", ") || "Sin Cronograma",
          cronogramaId: auditoria.cronograma_id || [],
          cantidadAuditorias: auditoria.cantidad_auditorias || 0,
          vigencia_id: auditoria.vigencia_id || this.vigenciaId || 0,
          estado_nombre: auditoria.estado_nombre || "Sin estado",
          estado: auditoria.estado_nombre || "Sin estado",
          estado_id: auditoria.estado_id || 0,
          auditores: [],
        }
      : undefined;

    const dialogRef = this.dialog.open(AddAuditoriaModalComponent, {
      width: "1000px",
      autoFocus: false,
      data: {
        usuario_id: this.usuarioId,
        usuario_rol: this.usuarioRol,
        planAuditoriaId: null,
        vigenciaId: this.vigenciaId,
        isEditExtraordinario: false, // TODO: Definir si se considera auditoría extraordinaria
        auditoria: auditoriaPadre,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        const offset = this.pageIndex * this.pageSize;
        this.cargarAuditorias(this.vigenciaId!, this.pageSize, offset);
      }
    });
  }

  enviaraAuditor(auditoria: Auditoria) {
    console.log("Enviar a auditor:", auditoria);
    this.alertaService.showErrorAlert("Funcionalidad en desarrollo");
  }

  editarAuditoriaConcreta(auditoria?: AuditoriaEspecialTablaRow): void {
    if (!auditoria?._id) {
      return;
    }

    const auditoriaParaAsignacion: AuditoriaAsignacion = {
      _id: auditoria._id,
      activo: true,
      titulo: auditoria.titulo || "Sin Titulo",
      subtitulo: auditoria.subtitulo || "",
      tipo_evaluacion_nombre: auditoria.tipo_evaluacion_nombre ? [auditoria.tipo_evaluacion_nombre] : [],
      tipo_evaluacion_id: auditoria.tipo_evaluacion_id ? [auditoria.tipo_evaluacion_id] : [],
      cronograma_nombre: Array.isArray(auditoria.cronograma_nombre)
        ? auditoria.cronograma_nombre
        : (auditoria.cronograma_nombre ? [auditoria.cronograma_nombre] : []),
      cronograma_id: Array.isArray(auditoria.cronograma_id)
        ? auditoria.cronograma_id
        : (auditoria.cronograma_id ? [auditoria.cronograma_id] : []),
      vigencia_id: auditoria.vigencia_id || this.vigenciaId || 0,
      vigencia_nombre: "",
      estado_nombre: auditoria.estado_nombre || "Sin estado",
      estado_id: auditoria.estado_id || 0,
      auditores: auditoria.auditores_id || [],
    };

    const dialogRef = this.dialog.open(ModalAgregarAuditorComponent, {
      width: "1100px",
      data: {
        auditoria: auditoriaParaAsignacion,
        usuarioRol: this.usuarioRol,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved || result) {
        const offset = this.pageIndex * this.pageSize;
        this.cargarAuditorias(this.vigenciaId!, this.pageSize, offset);
      }
    });
  }

  async alternarAuditoriasConcretas(auditoriaPadre: AuditoriaEspecialTablaRow): Promise<void> {
    // Validar que la auditoría padre tenga un ID válido, que no sea una auditoría concreta y que
    // está en la tabla actual para evitar errores al manipular las filas hijas (auditorías concretas).
    if (!auditoriaPadre._id || auditoriaPadre.esAuditoriaConcreta) {
      return;
    }

    const auditoriasActuales = [...this.dataSource.data];
    const indicePadre = auditoriasActuales.findIndex(
      (row) => row._id === auditoriaPadre._id && !row.esAuditoriaConcreta,
    );
    if (indicePadre < 0) {
      return;
    }

    // Si no se ha definido el número de auditorías concretas cargadas,
    // se asume que no se han cargado y se hace fetch.
    // De lo contrario, se usa la cantidad para seleccionar las filas hijas correspondientes.
    let auditoriasConcretas: AuditoriaEspecialTablaRow[] = [];
    if (auditoriaPadre.cantidadConcretasCargadas == null) {
      auditoriasConcretas = await this.traerAuditoriasConcretas(auditoriaPadre);
      auditoriasActuales.splice(indicePadre + 1, 0, ...auditoriasConcretas);
      auditoriaPadre.cantidadConcretasCargadas = auditoriasConcretas.length;
      this.dataSource.data = auditoriasActuales;
    }
    else {
      auditoriasConcretas = auditoriasActuales.splice(
        indicePadre + 1,
        auditoriaPadre.cantidadConcretasCargadas,
      );
    }

    // Alternar visibilidad de las hijas.
    const mostrarFilas = auditoriasConcretas.every((row) => row.filaOculta);
    auditoriasConcretas.forEach((row) => {
      row.filaOculta = !mostrarFilas;
    });
    auditoriaPadre.expandido = !auditoriaPadre.expandido;
  }

  esFilaPadre(auditoria: AuditoriaEspecialTablaRow): boolean {
    return !auditoria.esAuditoriaConcreta;
  }

  auditoriasConcretasVisibles(auditoriaPadre: AuditoriaEspecialTablaRow): boolean {
    return auditoriaPadre.expandido || false;
  }

  numeroVisual(auditoria: AuditoriaEspecialTablaRow): string | number {
    return auditoria.numero || "";
  }

  generarUnaAuditoria(auditoriaPadre: AuditoriaEspecialTablaRow): void {
    if (!auditoriaPadre._id) {
      return;
    }

    this.planAuditoriaService.post(`auditoria-padre/${auditoriaPadre._id}/generar-auditoria`, {}).subscribe({
      next: () => {
        this.alertaService.showSuccessAlert("Auditoría generada exitosamente").then(() => {
          const offset = this.pageIndex * this.pageSize;
          this.cargarAuditorias(this.vigenciaId!, this.pageSize, offset);
        });
      },
      error: (error) => {
        let mensajeError = "Error al generar la auditoría";
        if (error?.error?.Data?.includes("número máximo")) {
          mensajeError = "No se pueden generar más auditorías concretas para esta auditoría padre.";
        }
        console.error("Error al generar la auditoría:", error);
        this.alertaService.showErrorAlert(mensajeError);
      }
    });
  }

  async traerAuditoriasConcretas(
    auditoriaPadre: AuditoriaEspecialTablaRow
  ): Promise<AuditoriaEspecialTablaRow[]> {
    const padreId = auditoriaPadre._id || "padre-sin-id";
    const numeroPadre = auditoriaPadre.numero || "0";

    const auditoriasConcretas = await firstValueFrom(
      this.planAuditoriaMid.get(`auditoria?query=activo:true,auditoria_padre_id:${auditoriaPadre._id}`).pipe(
        map((res): AuditoriaEspecialTablaRow[] => {
          return res.Data.map(
            (item: Auditoria, index: number): AuditoriaEspecialTablaRow => {
              const numeroConcreto = `${numeroPadre}.${index + 1}`;
              return {
                numero: numeroConcreto,
                _id: item._id || `${padreId}-concreta-${index + 1}`,
                auditoria_padre_id: padreId,
                titulo: item.titulo || "Sin Titulo",
                subtitulo: item.subtitulo || "",
                tipo_evaluacion_id: item.tipo_evaluacion_id || 0,
                tipo_evaluacion_nombre: item.tipo_evaluacion_nombre || "Sin Asignar",
                cronograma_id: item.cronograma_id || [],
                cronograma_nombre: item.cronograma_nombre || [],
                macroproceso_id: item.macroproceso_id || 0,
                macroproceso_nombre: item.macroproceso_nombre || "",
                proceso_id: item.proceso_id || 0,
                proceso_nombre: item.proceso_nombre || "",
                dependencia_id: item.dependencia_id || 0,
                dependencia_nombre: item.dependencia_nombre || "",
                estado_id: item.estado_id || 0,
                estado_nombre: item.estado_nombre || "Sin estado",
                vigencia_id: item.vigencia_id || 0,
                esAuditoriaConcreta: true,
                filaOculta: true,
              };
            }
          )
        }),
        catchError((error): Observable<AuditoriaEspecialTablaRow[]> => {
          console.error("Error al cargar las auditorías concretas:", error);
          this.alertaService.showErrorAlert("Error al cargar las auditorías concretas");
          return of([]);
        })
      )
    );

    // TODO: Traer auditores y asignarlos a auditoría concreta

    return auditoriasConcretas;
  };

  manejarCambioPaginado(evento: PageEvent) {
    // Actualizar el índice de página y tamaño de página
    this.pageSize = evento.pageSize;
    this.pageIndex = evento.pageIndex;

    const offset = this.pageIndex * this.pageSize;
    this.cargarAuditorias(this.vigenciaId!, this.pageSize, offset);

    // Mantener sincronizado el estado visual del paginador
    this.paginator.length = this.totalRegistros;
    this.paginator.pageSize = this.pageSize;
    this.paginator.pageIndex = this.pageIndex;
  }
}
