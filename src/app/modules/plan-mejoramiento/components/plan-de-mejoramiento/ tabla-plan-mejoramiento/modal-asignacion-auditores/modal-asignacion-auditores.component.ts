import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { forkJoin, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { AutenticacionMidService } from "src/app/core/services/autenticacion-mid.service";

export interface DatosModalAsignacionAuditores {
  auditoria: any;
  usuarioId: number;
  role: string;
}

@Component({
    selector: "app-modal-asignacion-auditores",
    templateUrl: "./modal-asignacion-auditores.component.html",
    styleUrls: ["./modal-asignacion-auditores.component.css"],
    standalone: false
})
export class ModalAsignacionAuditoresComponent implements OnInit {
  /** Texto de descripción del modal (subtítulo con nombre de la auditoría) */
  subtituloModal: string = "";

  /** Texto formateado del cronograma (fechas inicio/fin) */
  cronogramaTexto: string = "";

  /** Nombres de los auditores ya asignados a la auditoría (solo lectura) */
  auditoresAuditoriaTexto: string = "";
  auditoresAuditoria: { nombre: string }[] = [];

  /** Auditores asignados al plan de mejoramiento (editables) */
  auditoresPlan: { id: string; nombre: string }[] = [];

  /** Lista de auditores disponibles para seleccionar en el dropdown */
  auditoresDisponibles: { id: string; nombre: string }[] = [];

  /** Auditor actualmente seleccionado en el dropdown */
  auditorSeleccionado: { id: string; nombre: string } | null = null;

  /** IDs de los registros auditoria-auditor del plan ya existentes (para DELETE) */
  private registrosAuditoresPlan: {
    registroId: string;
    auditorId: string;
    nombre: string;
  }[] = [];

  /** Auditores marcados para eliminar al guardar */
  private readonly auditoresAEliminar: string[] = [];

  cargando: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DatosModalAsignacionAuditores,
    private readonly dialogRef: MatDialogRef<ModalAsignacionAuditoresComponent>,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly alertService: AlertService,
    private readonly autenticacionMidService: AutenticacionMidService
  ) {}

  ngOnInit(): void {
    // Datos estáticos: se resuelven síncronamente, el template los tiene de inmediato
    this.inicializarDatos();
    this.cargarAuditoresAuditoria();
    setTimeout(() => this.cargarDatosEnParalelo(), 0);
  }

  private inicializarDatos(): void {
    const auditoria = this.data.auditoria;
    this.subtituloModal = auditoria?.titulo ?? "";

    const inicio = auditoria?.fecha_inicio
      ? new Date(auditoria.fecha_inicio).toLocaleDateString("es-CO")
      : "";
    const fin = auditoria?.fecha_fin
      ? new Date(auditoria.fecha_fin).toLocaleDateString("es-CO")
      : "";
    this.cronogramaTexto =
      inicio && fin ? `${inicio} — ${fin}` : "Sin cronograma registrado";
  }

  /** Carga los auditores ya asignados a la auditoría (campo read-only) */
  private cargarAuditoresAuditoria(): void {
    const auditores = this.data.auditoria?.auditores ?? [];

    this.auditoresAuditoria = auditores.map((a: any) => ({
      nombre: a.auditor_nombre,
    }));

    this.auditoresAuditoriaTexto = auditores.length
      ? auditores.map((a: any) => a.auditor_nombre).join(", ")
      : "Sin auditor(es)";
  }

  private cargarDatosEnParalelo(): void {
    const planId = this.data.auditoria?.planMejoramientoId;
    this.cargando = true;

    const plan$ = planId
      ? this.planAuditoriaMid
          .get(
            `plan-mejoramiento-auditor?query=plan_mejoramiento_id:${planId},activo:true`
          )
          .pipe(
            catchError((err) => {
              console.error("Error al cargar auditores del plan:", err);
              return of(null);
            })
          )
      : of(null);

    const disponibles$ = this.autenticacionMidService
      .get("rol/periods")
      .pipe(
        catchError((err) => {
          console.error("Error al cargar auditores disponibles:", err);
          return of(null);
        })
      );

    forkJoin({ plan: plan$, disponibles: disponibles$ }).subscribe({
      next: ({ plan, disponibles }) => {
        this.procesarAuditoresDisponibles(disponibles);
        this.procesarAuditoresPlan(plan);
        // Filtra disponibles quitando los ya asignados al plan
        this.auditoresDisponibles = this.auditoresDisponibles.filter(
          (a) => !this.auditoresPlan.some((ap) => ap.id === a.id)
        );
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      },
    });
  }

  private procesarAuditoresPlan(res: any): void {
    const registros: any[] = res?.Data ?? [];
    this.registrosAuditoresPlan = registros.map((r) => ({
      registroId: r._id,
      auditorId: String(r.auditor_id),
      nombre: r.auditor_nombre ?? `Auditor ${r.auditor_id}`,
    }));
    this.auditoresPlan = this.registrosAuditoresPlan.map((r) => ({
      id: r.auditorId,
      nombre: r.nombre,
    }));
  }

  private procesarAuditoresDisponibles(res: any): void {
    if (!res?.Data) return;

    const auditorMap = new Map();

    res.Data.filter(
      (auditor: any) =>
        auditor.finalizado === false &&
        ["AUDITOR", "AUDITOR EXPERTO", "AUDITOR ASISTENTE"].includes(
          auditor.rol_usuario
        )
    ).forEach((auditor: any) => {
      auditorMap.set(auditor.id_tercero, {
        id: String(auditor.id_tercero),
        nombre: auditor.nombre,
      });
    });

    this.auditoresDisponibles = Array.from(auditorMap.values()) as {
      id: string;
      nombre: string;
    }[];
  }

  /** Agrega el auditor seleccionado en el dropdown a la lista local */
  agregarAuditorPlan(): void {
    if (!this.auditorSeleccionado) return;

    const yaExiste = this.auditoresPlan.some(
      (a) => a.id === this.auditorSeleccionado!.id
    );
    if (yaExiste) {
      this.alertService.showAlert(
        "Auditor duplicado",
        "Este auditor ya fue agregado al plan."
      );
      return;
    }

    this.auditoresPlan = [
      ...this.auditoresPlan,
      { ...this.auditorSeleccionado },
    ];
    this.auditoresDisponibles = this.auditoresDisponibles.filter(
      (a) => a.id !== this.auditorSeleccionado!.id
    );
    this.auditorSeleccionado = null;
  }

  /** Elimina un auditor de la lista local y lo marca para eliminar al guardar */
  eliminarAuditorPlan(index: number): void {
    const auditor = this.auditoresPlan[index];
    const registro = this.registrosAuditoresPlan.find(
      (r) => r.auditorId === auditor.id
    );

    if (registro) {
      this.auditoresAEliminar.push(registro.registroId);
    }

    this.auditoresDisponibles = [...this.auditoresDisponibles, auditor];
    this.auditoresPlan = this.auditoresPlan.filter((_, i) => i !== index);
  }

  /** Guarda los cambios: elimina los marcados y crea los nuevos */
  guardarYCerrar(): void {
    if (this.auditoresPlan.length === 0) {
      this.alertService.showAlert(
        "Sin auditores",
        "Debe asignar al menos un auditor responsable del plan."
      );
      return;
    }

    this.alertService
      .showConfirmAlert(
        "¿Está seguro de guardar los auditores responsables del plan de mejoramiento?"
      )
      .then((confirmado) => {
        if (!confirmado.value) return;
        this.ejecutarGuardado();
      });
  }

  private ejecutarGuardado(): void {
    const planId = this.data.auditoria?.planMejoramientoId;

    if (!planId) {
      this.alertService.showAlert(
        "Plan no registrado",
        "Primero debe registrar el plan desde la acción 'Registrar Plan'."
      );
      return;
    }

    const auditoresNuevos = this.auditoresPlan.filter(
      (a) => !this.registrosAuditoresPlan.some((r) => r.auditorId === a.id)
    );

    const posts$ = auditoresNuevos.map((a) =>
      this.planAuditoriaService
        .post("plan-mejoramiento-auditor", {
          plan_mejoramiento_id: planId,
          auditor_id: Number(a.id),
          asignado: true,
          asignado_por_id: this.data.usuarioId,
          auditor_lider: false,
          activo: true,
        })
        .pipe(catchError(() => of(null)))
    );

    const deletes$ = this.auditoresAEliminar.map((registroId) =>
      this.planAuditoriaService
        .delete("plan-mejoramiento-auditor", { id: registroId })
        .pipe(catchError(() => of(null)))
    );

    const operaciones$ = [...posts$, ...deletes$];

    if (operaciones$.length === 0) {
      this.alertService.showSuccessAlert(
        "Sin cambios que guardar.",
        "Sin cambios"
      );
      this.dialogRef.close(false);
      return;
    }

    forkJoin(operaciones$).subscribe({
      next: () => {
        this.alertService.showSuccessAlert(
          "Auditores del plan asignados correctamente.",
          "Guardado exitoso"
        );
        this.dialogRef.close(true);
      },
      error: () => {
        this.alertService.showErrorAlert(
          "Error al guardar los auditores del plan."
        );
      },
    });
  }
}