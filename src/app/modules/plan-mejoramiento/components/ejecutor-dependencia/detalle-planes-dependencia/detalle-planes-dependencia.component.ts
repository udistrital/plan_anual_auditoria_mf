import { Component, Inject, OnInit, signal } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { EjecutorVigente } from "../consulta-ejecutores/consulta-ejecutores.component";
import { detallePlanesDependenciaConstructorTabla } from "./detalle-planes-dependencia.utilidades";

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
}

@Component({
  selector: "app-detalle-planes-dependencia",
  templateUrl: "./detalle-planes-dependencia.component.html",
  styleUrls: ["./detalle-planes-dependencia.component.scss"],
  standalone: false,
})
export class DetallePlanesDependenciaComponent implements OnInit {
  /** Definición declarativa de columnas (misma estructura que tabla-plan-mejoramiento). */
  planesConstructorTabla = detallePlanesDependenciaConstructorTabla;
  /** Lista de columnDef derivada del constructor, usada por matHeaderRowDef/matRowDef. */
  tablaColumnas: string[] = this.planesConstructorTabla.map((c) => c.columnDef);
  dataSource = new MatTableDataSource<PlanFila>([]);
  cargando = signal<boolean>(true);
  guardando = signal<boolean>(false);

  readonly iconosAccion = new Map<string, string>([
    ["Gestionar",   "manage_accounts"],
    ["Asignar",     "person_add"],
    ["Desasignar",  "person_remove"],
  ]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DatosDetallePlanes,
    private readonly dialogRef: MatDialogRef<DetallePlanesDependenciaComponent>,
    private readonly planService: PlanAnualAuditoriaService,
    private readonly alertaService: AlertService
  ) {}

  ngOnInit(): void {
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

  /** Icono Material asociado a cada acción (análogo a tabla-plan-mejoramiento). */
  getIconoAccion(accion: string): string {
    return this.iconosAccion.get(accion) ?? "help_outline";
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
          this.dataSource.data = (resp?.Data ?? []) as PlanFila[];
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

  /** Asigna el plan al ejecutor seleccionado (crea la fila puente). */
  asignarPlan(plan: PlanFila, ejecutor: EjecutorVigente): void {
    this.guardando.set(true);
    const body = {
      ejecutor_dependencia_id: ejecutor._id,
      plan_mejoramiento_id: plan.plan_mejoramiento_id,
      actual: true,
      activo: true,
      fecha_asignacion: new Date().toISOString(),
    };

    this.planService.post("ejecutor-plan", body).subscribe({
      next: () => {
        this.guardando.set(false);
        this.alertaService.showSuccessAlert(
          `Plan asignado a ${ejecutor.usuario_nombre}.`,
          "Asignación exitosa"
        );
        this.cargarPlanes();
      },
      error: (err: any) => {
        this.guardando.set(false);
        const mensaje =
          err?.error?.Data ??
          "No se pudo asignar el plan al ejecutor. Inténtalo nuevamente.";
        this.alertaService.showErrorAlert(mensaje);
      },
    });
  }

  /** Retira la asignación de un plan a un ejecutor (borrado lógico en la puente). */
  quitarAsignacion(plan: PlanFila, ejecutor: EjecutorDePlan): void {
    this.alertaService
      .showConfirmAlert(
        `Se desasignará el plan a ${ejecutor.usuario_nombre}.`,
        "¿Deseas continuar?"
      )
      .then((result) => {
        if (!result.value) return;
        this.planService
          .delete("ejecutor-plan", { id: ejecutor.ejecutor_plan_id })
          .subscribe({
            next: () => {
              this.alertaService.showSuccessAlert(
                "La asignación fue retirada.",
                "Eliminado"
              );
              this.cargarPlanes();
            },
            error: () => {
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
