import { Component, Inject, OnInit, signal } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { forkJoin, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { RolService } from "src/app/core/services/rol.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";
import { EjecutorVigente } from "../consulta-ejecutores/consulta-ejecutores.component";

export interface DatosDetallePlanes {
  dependencia_id: number;
  dependencia_nombre: string;
  ejecutores: EjecutorVigente[];
}

/** Ejecutor asignado a un plan concreto (viene del MID, tabla puente ejecutor_plan). */
interface EjecutorDePlan {
  ejecutor_plan_id: string;
  ejecutor_dependencia_id: string;
  usuario_id: number | null;
  usuario_nombre: string;
}

interface PlanFila {
  plan_mejoramiento_id: string;
  vigencia_id: number;
  /** Nombre de la vigencia resuelto por el MID. */
  vigencia_nombre?: string | null;
  fecha_apertura: string | Date;
  fecha_limite: string | Date;
  estado_id: number;
  /** Nombre del estado del plan resuelto por el MID. */
  estado_nombre?: string | null;
  /** Ejecutores asignados a este plan. */
  ejecutores?: EjecutorDePlan[];
  /**
   * Ids de ejecutor_dependencia seleccionados en el desplegable para asignar.
   * Se materializa al pulsar "Guardar" en el panel.
   */
  seleccionados?: string[];
}

@Component({
  selector: "app-detalle-planes-dependencia",
  templateUrl: "./detalle-planes-dependencia.component.html",
  styleUrls: ["./detalle-planes-dependencia.component.scss"],
  standalone: false,
})
export class DetallePlanesDependenciaComponent implements OnInit {
  /** Planes de la dependencia, con sus ejecutores ya asignados. */
  planes: PlanFila[] = [];
  cargando = signal<boolean>(true);
  guardando = signal<boolean>(false);
  /** Solo los roles de auditado pueden asignar/desasignar ejecutores. */
  puedeEditar = signal<boolean>(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DatosDetallePlanes,
    private readonly dialogRef: MatDialogRef<DetallePlanesDependenciaComponent>,
    private readonly planService: PlanAnualAuditoriaService,
    private readonly rolService: RolService,
    private readonly alertaService: AlertService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.rolService.cargarRoles();
      this.puedeEditar.set(
        this.rolService.permisoCreacion([
          environment.ROL.JEFE_DEPENDENCIA,
          environment.ROL.ASISTENTE_DEPENDENCIA,
        ])
      );
    } catch (error) {
      console.error("Error al cargar los roles del usuario:", error);
    }
    this.cargarPlanes();
  }

  get nombresEjecutores(): string {
    if (!this.data.ejecutores || this.data.ejecutores.length === 0) {
      return "Sin ejecutor asignado";
    }
    return this.data.ejecutores.map((e) => e.usuario_nombre).join(", ");
  }

  /** ¿Hay al menos un ejecutor vigente en la dependencia para poder asignar? */
  get hayEjecutores(): boolean {
    return (this.data.ejecutores?.length ?? 0) > 0;
  }

  /**
   * Obtiene los planes de mejoramiento de la dependencia desde el MID, que
   * resuelve la cadena auditoria_padre -> auditoria -> plan_mejoramiento e
   * incluye los ejecutores ya asignados a cada plan.
   */
  private cargarPlanes(): void {
    this.cargando.set(true);
    this.planService
      .planilla(
        `ejecutor-dependencia/dependencia/${this.data.dependencia_id}/planes`
      )
      .subscribe({
        next: (resp: any) => {
          this.planes = ((resp?.Data ?? []) as PlanFila[]).map((p) => ({
            ...p,
            ejecutores: p.ejecutores ?? [],
            seleccionados: [],
          }));
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.alertaService.showErrorAlert(
            "No se pudieron cargar los planes de mejoramiento de la dependencia."
          );
        },
      });
  }

  /** Ejecutores de la dependencia que aún no están asignados a ese plan. */
  ejecutoresDisponibles(plan: PlanFila): EjecutorVigente[] {
    const asignadosIds = new Set(
      (plan.ejecutores ?? []).map((e) => e.ejecutor_dependencia_id)
    );
    return (this.data.ejecutores ?? []).filter(
      (e) => !asignadosIds.has(e._id)
    );
  }

  /**
   * Guarda las asignaciones seleccionadas en el desplegable del plan: crea una
   * fila puente por cada ejecutor elegido. Tras confirmar, recarga la lista.
   */
  guardarAsignaciones(plan: PlanFila): void {
    if (!this.puedeEditar()) return;

    const seleccion = plan.seleccionados ?? [];
    if (seleccion.length === 0) {
      this.alertaService.showAlert(
        "Atención",
        "Selecciona al menos un ejecutor para asignar."
      );
      return;
    }

    this.alertaService
      .showConfirmAlert(
        `Se asignará el plan a ${seleccion.length} ejecutor(es).`,
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
              plan_mejoramiento_id: plan.plan_mejoramiento_id,
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
            this.cargarPlanes();
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
  quitarAsignacion(plan: PlanFila, ejecutor: EjecutorDePlan): void {
    if (!this.puedeEditar()) return;

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
              this.cargarPlanes();
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
