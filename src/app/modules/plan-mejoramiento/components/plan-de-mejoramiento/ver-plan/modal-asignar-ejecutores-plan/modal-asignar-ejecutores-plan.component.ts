import { Component, Inject, OnInit, signal } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { forkJoin, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { EjecutorVigente } from "../../../ejecutor-dependencia/consulta-ejecutores/consulta-ejecutores.component";

/** Dependencia auditada del plan (id + nombre), par resuelto desde la auditoría. */
export interface DependenciaPlan {
  dependencia_id: number;
  dependencia_nombre: string;
}

/**
 * Datos de entrada del modal. Un plan de mejoramiento puede cubrir varias
 * dependencias auditadas; cada una se gestiona en su propio panel.
 *
 * `soloLectura` desactiva asignar/desasignar; lo usa únicamente la vista del
 * Auditor experto (`ver-plan`). El auditado (`registrar-plan`) siempre abre el
 * modal en modo edición, en cualquier estado del plan.
 */
export interface DatosAsignarEjecutoresPlan {
  plan_mejoramiento_id: string;
  dependencias: DependenciaPlan[];
  soloLectura: boolean;
}

/** Ejecutor ya asignado al plan (fila puente ejecutor_plan resuelta por el MID). */
interface EjecutorDePlan {
  ejecutor_plan_id: string;
  ejecutor_dependencia_id: string;
  usuario_id: number | null;
  usuario_nombre: string;
}

/**
 * Panel por dependencia auditada del plan: ejecutores vigentes de la
 * dependencia, ejecutores ya asignados al plan y la selección pendiente.
 */
interface PanelDependencia {
  dependencia_id: number;
  dependencia_nombre: string;
  /** Ejecutores vigentes de la dependencia (CRUD ejecutor-dependencia). */
  ejecutoresVigentes: EjecutorVigente[];
  /** Ejecutores ya asignados a este plan por esa dependencia. */
  asignados: EjecutorDePlan[];
  /** Ids de ejecutor_dependencia seleccionados en el desplegable. */
  seleccionados: string[];
}

/**
 * Asigna/consulta los ejecutores de un plan de mejoramiento concreto, agrupados
 * por dependencia auditada. Reutiliza los endpoints del submódulo de ejecutor
 * por dependencia (MID para listar, CRUD ejecutor-plan para persistir).
 */
@Component({
  selector: "app-modal-asignar-ejecutores-plan",
  templateUrl: "./modal-asignar-ejecutores-plan.component.html",
  styleUrls: ["./modal-asignar-ejecutores-plan.component.css"],
  standalone: false,
})
export class ModalAsignarEjecutoresPlanComponent implements OnInit {
  paneles: PanelDependencia[] = [];
  cargando = signal<boolean>(true);
  guardando = signal<boolean>(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DatosAsignarEjecutoresPlan,
    private readonly dialogRef: MatDialogRef<ModalAsignarEjecutoresPlanComponent>,
    private readonly planService: PlanAnualAuditoriaService,
    private readonly alertaService: AlertService
  ) {}

  ngOnInit(): void {
    this.cargarDependencias();
  }

  get soloLectura(): boolean {
    return this.data.soloLectura;
  }

  /** ¿La dependencia tiene al menos un ejecutor vigente para poder asignar? */
  hayEjecutores(panel: PanelDependencia): boolean {
    return panel.ejecutoresVigentes.length > 0;
  }

  /** Ejecutores vigentes de la dependencia que aún no están en el plan. */
  ejecutoresDisponibles(panel: PanelDependencia): EjecutorVigente[] {
    const asignadosIds = new Set(
      panel.asignados.map((e) => e.ejecutor_dependencia_id)
    );
    return panel.ejecutoresVigentes.filter((e) => !asignadosIds.has(e._id));
  }

  /**
   * Para cada dependencia auditada del plan, carga en paralelo:
   *  - sus ejecutores vigentes (CRUD ejecutor-dependencia, activo:true), y
   *  - los ejecutores ya asignados a ESTE plan (MID planes por dependencia,
   *    filtrando al plan_mejoramiento_id actual).
   */
  private cargarDependencias(): void {
    const dependencias = this.data.dependencias ?? [];
    if (dependencias.length === 0) {
      this.paneles = [];
      this.cargando.set(false);
      return;
    }

    this.cargando.set(true);
    const consultas = dependencias.map((dep) =>
      forkJoin({
        vigentes: this.ejecutoresVigentesDependencia$(dep.dependencia_id),
        asignados: this.ejecutoresAsignadosAlPlan$(dep.dependencia_id),
      }).pipe(
        map(({ vigentes, asignados }) => ({
          dependencia_id: dep.dependencia_id,
          dependencia_nombre: dep.dependencia_nombre,
          ejecutoresVigentes: vigentes,
          asignados,
          seleccionados: [] as string[],
        }))
      )
    );

    forkJoin(consultas).subscribe({
      next: (paneles) => {
        this.paneles = paneles;
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.alertaService.showErrorAlert(
          "No se pudieron cargar los ejecutores de las dependencias del plan."
        );
      },
    });
  }

  /**
   * Ejecutores vigentes (activos) de una dependencia.
   */
  private ejecutoresVigentesDependencia$(dependenciaId: number) {
    return this.planService
      .planilla(`ejecutor-dependencia?busqueda=${dependenciaId}&limit=0&offset=0`)
      .pipe(
        map((resp: any) => {
          const filas = (resp?.Data ?? []) as any[];
          const fila = filas.find(
            (f) => Number(f.dependencia_id) === Number(dependenciaId)
          );
          return (fila?.ejecutores ?? []) as EjecutorVigente[];
        }),
        catchError(() => of([] as EjecutorVigente[]))
      );
  }

  /**
   * Ejecutores ya asignados a ESTE plan para la dependencia. El MID devuelve los
   * planes de la dependencia con sus ejecutores; se filtra al plan actual.
   */
  private ejecutoresAsignadosAlPlan$(dependenciaId: number) {
    return this.planService
      .planilla(`ejecutor-dependencia/dependencia/${dependenciaId}/planes`)
      .pipe(
        map((resp: any) => {
          const planes = (resp?.Data ?? []) as any[];
          const plan = planes.find(
            (p) => p.plan_mejoramiento_id === this.data.plan_mejoramiento_id
          );
          return (plan?.ejecutores ?? []) as EjecutorDePlan[];
        }),
        catchError(() => of([] as EjecutorDePlan[]))
      );
  }

  /**
   * Asigna al plan los ejecutores seleccionados de una dependencia: crea una
   * fila puente (ejecutor-plan) por cada uno. Tras confirmar, recarga.
   */
  guardarAsignaciones(panel: PanelDependencia): void {
    if (this.soloLectura) return;

    const seleccion = panel.seleccionados ?? [];
    if (seleccion.length === 0) {
      this.alertaService.showAlert(
        "Atención",
        "Selecciona al menos un ejecutor para asignar."
      );
      return;
    }

    this.alertaService
      .showConfirmAlert(
        `Se asignará el plan a ${seleccion.length} ejecutor(es) de ${panel.dependencia_nombre}.`,
        "¿Deseas continuar?"
      )
      .then((result) => {
        if (!result.value) return;
        this.guardando.set(true);
        const fecha = new Date().toISOString();
        const peticiones = seleccion.map((edId) =>
          this.planService
            .post("ejecutor-plan", {
              ejecutor_dependencia_id: edId,
              plan_mejoramiento_id: this.data.plan_mejoramiento_id,
              actual: true,
              activo: true,
              fecha_asignacion: fecha,
            })
            .pipe(catchError((err) => of({ error: err })))
        );

        forkJoin(peticiones).subscribe({
          next: (resultados: any[]) => {
            this.guardando.set(false);
            const conError = resultados.filter((r) => r?.error).length;
            if (conError === 0) {
              this.alertaService.showSuccessAlert(
                "Ejecutores asignados al plan.",
                "Asignación exitosa"
              );
            } else {
              this.alertaService.showAlert(
                "Asignación parcial",
                `${resultados.length - conError} asignados, ${conError} con error.`
              );
            }
            this.cargarDependencias();
          },
          error: () => {
            this.guardando.set(false);
            this.alertaService.showErrorAlert(
              "No se pudieron asignar los ejecutores. Inténtalo nuevamente."
            );
          },
        });
      });
  }

  /** Desasigna el plan de un ejecutor (borrado lógico en la puente) tras confirmar. */
  quitarAsignacion(ejecutor: EjecutorDePlan): void {
    if (this.soloLectura) return;

    this.alertaService
      .showConfirmAlert(
        `Se desasignará el plan a ${ejecutor.usuario_nombre}.`,
        "¿Deseas continuar?"
      )
      .then((result) => {
        if (!result.value) return;
        this.guardando.set(true);
        this.planService
          .delete("ejecutor-plan", { id: ejecutor.ejecutor_plan_id })
          .subscribe({
            next: () => {
              this.guardando.set(false);
              this.alertaService.showSuccessAlert(
                "La asignación fue retirada.",
                "Eliminado"
              );
              this.cargarDependencias();
            },
            error: () => {
              this.guardando.set(false);
              this.alertaService.showErrorAlert(
                "No se pudo retirar la asignación. Inténtalo nuevamente."
              );
            },
          });
      });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
