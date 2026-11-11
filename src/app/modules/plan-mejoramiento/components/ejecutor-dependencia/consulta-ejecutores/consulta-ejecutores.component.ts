import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  inject,
  signal,
} from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatPaginator } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { environment } from "src/environments/environment";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { AutenticacionMidService } from "src/app/core/services/autenticacion-mid.service";
import { RolService } from "src/app/core/services/rol.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { DetallePlanesDependenciaComponent } from "../detalle-planes-dependencia/detalle-planes-dependencia.component";

/** Fila consolidada que combina la dependencia con su(s) ejecutor(es) vigentes. */
export interface FilaDependenciaEjecutor {
  dependencia_id: number;
  dependencia_nombre: string;
  ejecutores: EjecutorVigente[];
  sin_asignar: boolean;
}

export interface EjecutorVigente {
  _id: string;
  usuario_id: number;
  usuario_nombre: string;
  usuario_documento: string | null;
  usuario_correo: string | null;
  fecha_asignacion: string | Date;
}

@Component({
  selector: "app-consulta-ejecutores",
  templateUrl: "./consulta-ejecutores.component.html",
  styleUrls: ["./consulta-ejecutores.component.scss"],
  standalone: false,
})
export class ConsultaEjecutoresComponent implements OnInit {
  paginator!: MatPaginator;

  @ViewChild(MatPaginator)
  set matPaginator(paginator: MatPaginator | undefined) {
    if (paginator && paginator !== this.paginator) {
      this.paginator = paginator;
      this.configurarPaginador();
    }
  }

  formBusqueda!: FormGroup;

  /** Dependencias con su(s) ejecutor(es), una por panel del acordeón. */
  dependencias: FilaDependenciaEjecutor[] = [];

  total = 0;
  opcionesPagina: number[] = [10, 15, 20];

  cargando = signal<boolean>(false);
  permisoEdicion = signal<boolean>(false);
  hayBusquedaActiva = signal<boolean>(false);

  private readonly fb = inject(FormBuilder);
  /**
   * Servicio unificado: `get/delete` golpean el CRUD y `planilla` el MID,
   * ambos con PLAN_ANUAL_AUDITORIA_SERVICE / PLAN_ANUAL_AUDITORIA_MID.
   */
  private readonly planService = inject(PlanAnualAuditoriaService);
  private readonly autenticacionService = inject(AutenticacionMidService);
  private readonly rolService = inject(RolService);
  private readonly alertaService = inject(AlertService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  async ngOnInit(): Promise<void> {
    this.formBusqueda = this.fb.group({ dependencia: [""] });

    try {
      await this.rolService.cargarRoles();
      // Solo los roles de auditado pueden asignar/gestionar ejecutores.
      const rolesGestion = [
        environment.ROL.JEFE_DEPENDENCIA,
        environment.ROL.ASISTENTE_DEPENDENCIA,
      ];
      this.permisoEdicion.set(this.rolService.permisoCreacion(rolesGestion));
    } catch (error) {
      console.error("Error al cargar los roles del usuario:", error);
    }

    this.cargarEjecutores(this.opcionesPagina[0], 0);
  }

  private configurarPaginador(): void {
    this.paginator._intl.itemsPerPageLabel = "Elementos por página";
    this.paginator._intl.nextPageLabel = "Página siguiente";
    this.paginator._intl.previousPageLabel = "Página anterior";
    this.paginator._intl.firstPageLabel = "Primera página";
    this.paginator._intl.lastPageLabel = "Última página";
    this.paginator._intl.getRangeLabel = (
      page: number,
      pageSize: number,
      length: number
    ) => {
      if (length === 0 || pageSize === 0) return `0 de ${length}`;
      const startIndex = page * pageSize;
      const endIndex = Math.min(startIndex + pageSize, length);
      return `${startIndex + 1} - ${endIndex} de ${length}`;
    };

    this.paginator.page.subscribe(() => {
      const limit = this.paginator.pageSize;
      const offset = this.paginator.pageIndex * limit;
      this.cargarEjecutores(limit, offset);
    });
  }

  iniciarPaginacion(): void {
    if (this.paginator) {
      this.paginator.pageIndex = 0;
      this.paginator.pageSize = this.opcionesPagina[0];
    }
  }

  /**
   * Carga las dependencias con su(s) ejecutor(es) vigente(s) desde el MID, que
   * ya devuelve los datos consolidados (nombre de dependencia y de cada usuario).
   */
  cargarEjecutores(limit: number, offset: number): void {
    this.cargando.set(true);
    const endpoint = `ejecutor-dependencia?limit=${limit}&offset=${offset}`;

    this.planService.planilla(endpoint).subscribe({
      next: (resp: any) => {
        const data: FilaDependenciaEjecutor[] = resp?.Data ?? [];
        this.total = resp?.MetaData?.Count ?? data.length;
        this.establecerDependencias(data);
        this.cargando.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando.set(false);
        this.alertaService.showErrorAlert(
          "Ocurrió un error al obtener los ejecutores. Inténtalo nuevamente."
        );
      },
    });
  }

  /** Guarda las dependencias y reconstruye las filas aplanadas de la tabla. */
  private establecerDependencias(data: FilaDependenciaEjecutor[]): void {
    this.dependencias = data;
  }

  buscar(): void {
    const termino = (this.formBusqueda.get("dependencia")?.value ?? "")
      .toString()
      .trim()
      .toLowerCase();

    if (!termino) {
      this.alertaService.showAlert(
        "Atención",
        "Ingresa el nombre o código de una dependencia para buscar."
      );
      return;
    }

    this.hayBusquedaActiva.set(true);
    this.iniciarPaginacion();
    this.cargando.set(true);
    const endpoint = `ejecutor-dependencia?busqueda=${encodeURIComponent(termino)}&limit=${this.opcionesPagina[0]}&offset=0`;

    this.planService.planilla(endpoint).subscribe({
      next: (resp: any) => {
        const data: FilaDependenciaEjecutor[] = resp?.Data ?? [];
        this.total = resp?.MetaData?.Count ?? data.length;
        this.establecerDependencias(data);
        this.cargando.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando.set(false);
        this.alertaService.showErrorAlert(
          "Ocurrió un error al buscar. Inténtalo nuevamente."
        );
      },
    });
  }

  limpiarBusqueda(): void {
    this.formBusqueda.get("dependencia")?.setValue("");
    this.hayBusquedaActiva.set(false);
    this.iniciarPaginacion();
    this.cargarEjecutores(this.opcionesPagina[0], 0);
  }

  /**
   * Redirige a la página de asignación/reasignación de ejecutor.
   * Si llega una fila, preselecciona su dependencia por queryParams.
   */
  asignarEjecutor(fila?: FilaDependenciaEjecutor): void {
    const queryParams = fila
      ? {
          dependencia_id: fila.dependencia_id,
          dependencia_nombre: fila.dependencia_nombre,
        }
      : {};
    this.router.navigate(
      ["/plan-mejoramiento/ejecutor-dependencia/asignar-ejecutor"],
      { queryParams }
    );
  }

  /** Abre el detalle de planes de mejoramiento de la dependencia. */
  verPlanes(fila: FilaDependenciaEjecutor): void {
    this.dialog.open(DetallePlanesDependenciaComponent, {
      width: "1050px",
      maxWidth: "95vw",
      data: {
        dependencia_id: fila.dependencia_id,
        dependencia_nombre: fila.dependencia_nombre,
        ejecutores: fila.ejecutores,
      },
    });
  }

  eliminarEjecutor(ejecutor: EjecutorVigente): void {
    this.alertaService
      .showConfirmAlert(
        `Se retirará a ${ejecutor.usuario_nombre} como ejecutor de la dependencia.`,
        "¿Deseas continuar?"
      )
      .then((result) => {
        if (!result.value) return;
        this.planService
          .delete("ejecutor-dependencia", { id: ejecutor._id })
          .subscribe({
            next: () => {
              // Tras eliminar el registro, se remueve el rol EJECUTOR_AUDITADO.
              this.removerRolEjecutor(ejecutor.usuario_correo);
            },
            error: () => {
              this.alertaService.showErrorAlert(
                "No se pudo retirar al ejecutor. Inténtalo nuevamente."
              );
            },
          });
      });
  }

  /**
   * Remueve el rol EJECUTOR_AUDITADO del usuario en WSO2 (rol/remove). El
   * registro ya fue eliminado; si no hay correo o el remove falla, igual se
   * refresca el listado sin bloquear la operación.
   */
  private removerRolEjecutor(correo: string | null): void {
    const finalizar = () => {
      this.alertaService.showSuccessAlert(
        "El ejecutor fue retirado.",
        "Eliminado"
      );
      this.iniciarPaginacion();
      this.cargarEjecutores(this.opcionesPagina[0], 0);
    };

    if (!correo) {
      finalizar();
      return;
    }

    this.autenticacionService
      .postRol("rol/remove", "EJECUTOR_AUDITADO", correo)
      .subscribe({
        next: () => finalizar(),
        // El registro ya se eliminó; el fallo del remove no debe bloquear la UI.
        error: () => finalizar(),
      });
  }
}
