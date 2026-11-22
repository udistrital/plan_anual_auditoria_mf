import { Component, OnInit } from "@angular/core";
import { environment } from "src/environments/environment";
import type {
  AuditoriaFormulacionPlan,
  ResumenFormulacionPlanes,
} from "src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models";
import { DatosFilaVista, PerfilFormulacion } from "../compartido/formulacion.utilidades";
import { VistaFormulacionBase } from "../compartido/vista-formulacion.base";
import { GrupoEstadoPlan, perfilInterna } from "./vista-auditado.utilidades";
import { perfilExterna } from "./perfil-externa.utilidades";

export type FilaFormulacion = AuditoriaFormulacionPlan & DatosFilaVista;

type Grupo = Exclude<GrupoEstadoPlan, "TODOS">;
type Perfil = PerfilFormulacion<AuditoriaFormulacionPlan, ResumenFormulacionPlanes, Grupo>;

/**
 * Vista de la dependencia auditada. El select "Tipo de Evaluación" alterna entre el perfil de
 * Auditoría Interna y el de Auditoría Externa (issue 1): misma plantilla y lógica de la base,
 * cambian textos, indicadores, columnas, estados y acciones según el tipo seleccionado.
 */
@Component({
  selector: "app-formulacion-vista-auditado",
  templateUrl: "../compartido/vista-formulacion.html",
  styleUrls: ["../compartido/formulacion-planes.css"],
  standalone: false,
})
export class VistaAuditadoComponent
  extends VistaFormulacionBase<AuditoriaFormulacionPlan, ResumenFormulacionPlanes, Grupo>
  implements OnInit
{
  /** Perfiles disponibles, indexados por el Id de tipo de evaluación. */
  private readonly perfiles: Perfil[] = [perfilInterna, perfilExterna];

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

  private cargoId = 0;

  override async ngOnInit(): Promise<void> {
    this.cargoId = this.rol === environment.ROL.JEFE_DEPENDENCIA
      ? environment.CARGO.JEFE_DEPENDENCIA_ID
      : environment.CARGO.ASISTENTE_DEPENDENCIA_ID;
    await super.ngOnInit();
  }

  // TODO: confirmar la ruta del MID para hallazgos/acciones de auditoría externa;
  // hoy comparte el contrato interno y el tipo de evaluación viaja como parámetro de consulta.
  protected get rutaBase(): string {
    return `plan-mejoramiento/formulacion/auditado/${this.personaId}/${this.cargoId}`;
  }

  /** Al cambiar de tipo, el grupo de estado seleccionado vuelve a "TODOS" para evitar filtros inválidos. */
  protected override alCambiarTipoEvaluacion(): void {
    this.filtrosForm.patchValue({ grupoEstado: "TODOS" }, { emitEvent: false });
  }

  protected estadosDeGrupo(grupo: GrupoEstadoPlan): number[] {
    return this.perfil.estadosDeGrupo(grupo);
  }

  protected claseEstado(estadoId: number): string {
    return this.perfil.claseEstado(estadoId);
  }

  protected mapearFila(auditoria: AuditoriaFormulacionPlan): FilaFormulacion {
    return { ...auditoria, ...this.datosVista(auditoria) };
  }

  realizarAccion(fila: FilaFormulacion, accion: string): void {
    const acciones: Record<string, () => void> = {
      "Registrar Plan":           () => this.router.navigate([`/plan-mejoramiento/registrar-plan/${fila.auditoria_id}`]),
      "Ver Plan":                 () => this.router.navigate([`/plan-mejoramiento/ver-plan/${fila.auditoria_id}`]),
      "Ver Documentos Auditoría": () => this.verDocumentosAuditoria(fila),
      "Ver Observaciones":        () => this.verObservaciones(fila),
    };
    acciones[accion]?.();
  }
}
