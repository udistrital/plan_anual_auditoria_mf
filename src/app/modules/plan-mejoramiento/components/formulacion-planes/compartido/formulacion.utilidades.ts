import { PasoFlujo } from "src/app/shared/elements/components/flujo-pasos/flujo-pasos.component";
import { VarianteTarjetaIndicador } from "src/app/shared/elements/components/tarjeta-indicador/tarjeta-indicador.component";
import type { AuditoriaFormulacionPlan } from "src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models";

// ── Agrupación de estados del plan ──────────────────────────
export type ConTodos<G extends string> = G | "TODOS";

/** Funciones para pasar de un grupo de la vista a sus estados del plan y viceversa. */
export function crearAgrupador<G extends string>(estadosPorGrupo: Record<G, number[]>, grupoPorDefecto: NoInfer<G>) {
  const grupos = Object.keys(estadosPorGrupo) as G[];
  return {
    estadosDeGrupo: (grupo: ConTodos<G>): number[] => (grupo === "TODOS" ? [] : estadosPorGrupo[grupo]),
    grupoDeEstado: (estadoId: number): G => grupos.find((g) => estadosPorGrupo[g].includes(estadoId)) ?? grupoPorDefecto,
  };
}

// ── Configuración de cada vista ─────────────────────────────
/** Opción del select "Estado Plan" y de los chips de acceso rápido. */
export interface OpcionEstadoPlan<G extends string, R> {
  grupo: ConTodos<G>;
  opcion: string;
  chip: string;
  campoResumen: keyof R | null;
}

/** Tarjeta KPI; valor puede sumar varios campos del resumen. */
export interface IndicadorFormulacion<R> {
  titulo: string;
  valor: (resumen: R) => number;
  subtitulo: string;
  icono: string;
  nota: string;
  notaIcono: string;
  variante: VarianteTarjetaIndicador;
}

export interface ColumnaFormulacion<F> {
  columnDef: string;
  header: string;
  cell: (f: F) => string;
}

/** Textos del encabezado, la tabla y el modal de flujo. */
export interface TextosVistaFormulacion {
  titulo: string;
  etiqueta: string;
  descripcion: string;
  tituloTabla: string;
  tituloFlujo: string;
  tooltipFlujo: string;
  nombreExportacion: string;
}

export interface ConfigFlujo {
  descripcion: string;
  pasos: PasoFlujo[];
}

/** Campos que la vista agrega a cada fila del MID. */
export interface DatosFilaVista {
  claseEstado: string;
  acciones: string[];
  mostrarObservaciones: boolean;
}

// ── Tabla ───────────────────────────────────────────────────
/** Textos de la columna Auditoría en singular o plural (pipe i18nPlural, "#" es el número). */
export const pluralHallazgos: Record<string, string> = {
  "=1": "# Hallazgo detectado",
  other: "# Hallazgos detectados",
};

export const pluralObservaciones: Record<string, string> = {
  "=1": "# Observación del Auditor",
  other: "# Observaciones del Auditor",
};

export const iconosAccion = new Map<string, string>([
  ["Registrar Plan",               "edit"],
  ["Ver Plan",                     "visibility"],
  ["Dictaminar causas y acciones", "rate_review"],
  ["Ver Observaciones",            "history"],
  ["Asignar Auditor(es)",          "manage_accounts"],
]);

export function unirNombres(nombres: string[] | null | undefined): string {
  return nombres?.length ? nombres.join(", ") : "Sin asignar";
}

/** Columnas que comparten las vistas; cada vista elige cuáles y en qué orden. */
export const columnasComunes = {
  numero:              { columnDef: "numero",              header: "No. Auditoría",                 cell: (f: AuditoriaFormulacionPlan) => f.no_auditoria },
  vigencia:            { columnDef: "vigencia",            header: "Vigencia",                      cell: (f: AuditoriaFormulacionPlan) => f.vigencia_nombre },
  auditoria:           { columnDef: "auditoria",           header: "Auditoría",                     cell: (f: AuditoriaFormulacionPlan) => f.titulo },
  tipo:                { columnDef: "tipo",                header: "Tipo de Evaluación",            cell: (f: AuditoriaFormulacionPlan) => f.tipo_evaluacion_nombre },
  auditores_auditoria: { columnDef: "auditores_auditoria", header: "Auditor Responsable Auditoría", cell: (f: AuditoriaFormulacionPlan) => unirNombres(f.auditores_auditoria) },
  auditores_plan:      { columnDef: "auditores_plan",      header: "Auditor Responsable del Plan",  cell: (f: AuditoriaFormulacionPlan) => unirNombres(f.auditores_plan) },
  dependencia:         { columnDef: "dependencia",         header: "Dependencia",                   cell: (f: AuditoriaFormulacionPlan) => f.dependencia_nombre },
  estado:              { columnDef: "estado",              header: "Estado",                        cell: (f: AuditoriaFormulacionPlan) => f.estado_plan_nombre },
  acciones:            { columnDef: "acciones",            header: "Acciones",                      cell: (_f: AuditoriaFormulacionPlan) => "" },
} satisfies Record<string, ColumnaFormulacion<AuditoriaFormulacionPlan>>;
