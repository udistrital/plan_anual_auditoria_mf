import { Component } from "@angular/core";
import { environment } from "src/environments/environment";
import { ModalAsignacionAuditoresComponent } from "./modal-asignacion-auditores/modal-asignacion-auditores.component";
import type {
  AuditoriaFormulacionAuditor,
  ResumenFormulacionAuditor,
} from "src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models";
import { DatosFilaVista, PerfilFormulacion } from "../compartido/formulacion.utilidades";
import { VistaFormulacionBase } from "../compartido/vista-formulacion.base";
import {
  GrupoAuditor,
  PlazoPlan,
  calcularPlazo,
  perfilAuditorInterna,
  rolesDictamen,
  rolesVenTodas,
} from "./vista-auditor.utilidades";
import { perfilAuditorExterna } from "./perfil-externa.utilidades";

export type FilaAuditor = AuditoriaFormulacionAuditor & DatosFilaVista & { plazo: PlazoPlan | null };

type Perfil = PerfilFormulacion<AuditoriaFormulacionAuditor, ResumenFormulacionAuditor, GrupoAuditor>;

/**
 * Bandeja del auditor OCI. El select "Tipo de Evaluación" alterna entre el perfil de Auditoría
 * Interna y el de Auditoría Externa (issue 2): misma plantilla y lógica de la base, cambian
 * textos, indicadores, columnas, estados y acciones según el tipo seleccionado.
 */
@Component({
  selector: "app-formulacion-vista-auditor",
  templateUrl: "../compartido/vista-formulacion.html",
  styleUrls: ["../compartido/formulacion-planes.css"],
  standalone: false,
})
export class VistaAuditorComponent
  extends VistaFormulacionBase<AuditoriaFormulacionAuditor, ResumenFormulacionAuditor, GrupoAuditor>
{
  /** Perfiles disponibles, indexados por el Id de tipo de evaluación. */
  private readonly perfiles: Perfil[] = [perfilAuditorInterna, perfilAuditorExterna];

  protected override readonly tiposEvaluacion = this.perfiles.map((p) => ({
    Id: p.tipoEvaluacionId,
    Nombre: p.nombreTipoEvaluacion,
  }));

  /** Perfil activo según el tipo de evaluación seleccionado en el filtro. */
  private get perfil(): Perfil {
    const tipo = this.filtrosForm?.value.tipoEvaluacion ?? this.perfiles[0].tipoEvaluacionId;
    return this.perfiles.find((p) => p.tipoEvaluacionId === tipo) ?? this.perfiles[0];
  }

  // La configuración que lee la plantilla se resuelve dinámicamente desde el perfil activo.
  get textos() { return this.perfil.textos; }
  get flujo() { return this.perfil.flujo; }
  get indicadores() { return this.perfil.indicadores; }
  get opcionesEstadoPlan() { return this.perfil.opcionesEstadoPlan; }
  get columnas() { return this.perfil.columnas; }
  get columnasIds(): string[] { return this.perfil.columnas.map((c) => c.columnDef); }
  protected get accionesHabilitadas(): string[] { return this.perfil.accionesHabilitadas; }

  protected get rutaBase(): string {
    return `plan-mejoramiento/formulacion/auditor/${this.personaId}`;
  }

  protected override paramsExtra(): Record<string, string> {
    return { alcance: rolesVenTodas.includes(this.rol) ? "todas" : "asignadas" };
  }

  /** Al cambiar de tipo, el grupo de estado seleccionado vuelve a "TODOS" para evitar filtros inválidos. */
  protected override alCambiarTipoEvaluacion(): void {
    this.filtrosForm.patchValue({ grupoEstado: "TODOS" }, { emitEvent: false });
  }

  protected estadosDeGrupo(grupo: GrupoAuditor | "TODOS"): number[] {
    return this.perfil.estadosDeGrupo(grupo);
  }

  protected claseEstado(estadoId: number): string {
    return this.perfil.claseEstado(estadoId);
  }

  protected mapearFila(auditoria: AuditoriaFormulacionAuditor): FilaAuditor {
    const datos = this.datosVista(auditoria);
    // En revisión, "Ver Plan" abre ver-plan con Aprobar/Rechazar para quien puede dictaminar
    const dictamina =
      auditoria.estado_plan_id === environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO.REVISION_PLAN_MEJORAMIENTO_AUDITOR &&
      rolesDictamen.includes(this.rol);

    return {
      ...auditoria,
      ...datos,
      acciones: dictamina ? datos.acciones.map((a) => (a === "Ver Plan" ? "Dictaminar causas y acciones" : a)) : datos.acciones,
      plazo: calcularPlazo(auditoria),
    };
  }

  protected override columnasExportacion(a: AuditoriaFormulacionAuditor): Record<string, unknown> {
    return {
      ...super.columnasExportacion(a),
      "Acciones aprobadas": a.acciones_aprobadas,
      "Total acciones": a.total_acciones,
      "Asignada": a.asignada ? "Sí" : "No",
    };
  }

  /** true cuando el tipo de evaluación activo es Auditoría Externa (revisión incremental, issue 2). */
  private get esExterna(): boolean {
    return this.perfil.tipoEvaluacionId === environment.TIPO_EVALUACION.AUDITORIA_EXTERNA_ID;
  }

  realizarAccion(fila: FilaAuditor, accion: string): void {
    // En auditoría externa el dictamen es incremental: ver-plan abre en modo revisión externa.
    const verPlan = () =>
      this.router.navigate(
        [`/plan-mejoramiento/ver-plan/${fila.auditoria_id}`],
        this.esExterna ? { state: { revisionExterna: true } } : undefined,
      );
    const acciones: Record<string, () => void> = {
      "Ver Plan":                     verPlan,
      "Dictaminar causas y acciones": verPlan,
      "Ver Documentos Auditoría":     () => this.verDocumentosAuditoria(fila),
      "Ver Observaciones":            () => this.verObservaciones(fila),
      "Asignar Auditor(es)":          () => this.asignarAuditores(fila),
    };
    acciones[accion]?.();
  }

  /** Reutiliza el modal de la tabla de planes con la forma de datos que espera. */
  private asignarAuditores(fila: FilaAuditor): void {
    const dialogRef = this.dialog.open(ModalAsignacionAuditoresComponent, {
      width: "1100px",
      data: {
        auditoria: {
          _id: fila.auditoria_id,
          titulo: fila.titulo,
          tipo_evaluacion_nombre: fila.tipo_evaluacion_nombre,
          fecha_inicio: fila.fecha_inicio,
          fecha_fin: fila.fecha_fin,
          auditores: fila.auditores_auditoria.map((auditor_nombre) => ({ auditor_nombre })),
          planMejoramientoId: fila.plan_mejoramiento_id,
        },
        usuarioId: this.personaId,
        role: this.rol,
      },
    });
    dialogRef.afterClosed().subscribe((guardado: boolean) => {
      if (guardado) this.recargar();
    });
  }
}
