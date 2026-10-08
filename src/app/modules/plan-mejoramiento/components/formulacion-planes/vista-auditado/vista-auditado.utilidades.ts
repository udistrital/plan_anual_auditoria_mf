import { environment } from "src/environments/environment";
import { PasoFlujo } from "src/app/shared/elements/components/flujo-pasos/flujo-pasos.component";
import { VarianteTarjetaIndicador } from "src/app/shared/elements/components/tarjeta-indicador/tarjeta-indicador.component";
import type {
  AuditoriaFormulacionPlan,
  ResumenFormulacionPlanes,
} from "src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models";

const ESTADO = environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO;

// ── Agrupación de estados del plan ──────────────────────────
export type GrupoEstadoPlan = "TODOS" | "SIN_FORMULAR" | "EN_FORMULACION" | "EN_REVISION" | "APROBADOS";

export const estadosPorGrupo: Record<Exclude<GrupoEstadoPlan, "TODOS">, number[]> = {
  SIN_FORMULAR:   [ESTADO.SIN_PLAN_MEJORAMIENTO],
  EN_FORMULACION: [ESTADO.CREANDO_PLAN_MEJORAMIENTO, ESTADO.RECHAZADO_PLAN_MEJORAMIENTO],
  EN_REVISION:    [ESTADO.REVISION_PLAN_MEJORAMIENTO_AUDITOR],
  APROBADOS:      [ESTADO.APROBADO_PLAN_MEJORAMIENTO, ESTADO.FIN_PLAN_MEJORAMIENTO],
};

export function estadosDeGrupo(grupo: GrupoEstadoPlan): number[] {
  return grupo === "TODOS" ? [] : estadosPorGrupo[grupo];
}

export function grupoDeEstado(estadoId: number): GrupoEstadoPlan {
  const grupo = (Object.keys(estadosPorGrupo) as Exclude<GrupoEstadoPlan, "TODOS">[])
    .find((g) => estadosPorGrupo[g].includes(estadoId));
  return grupo ?? "SIN_FORMULAR";
}

// ── Filtro de estado: select "Estado Plan" y chips de acceso rápido ──
export const opcionesEstadoPlan: {
  grupo: GrupoEstadoPlan;
  opcion: string;
  chip: string;
  campoResumen: keyof ResumenFormulacionPlanes | null;
}[] = [
  { grupo: "TODOS",          opcion: "Todos los estados",       chip: "Todos",                  campoResumen: null },
  { grupo: "SIN_FORMULAR",   opcion: "Sin formular",            chip: "Sin Formular",           campoResumen: "sin_formular" },
  { grupo: "EN_FORMULACION", opcion: "En formulación",          chip: "En Formulación",         campoResumen: "en_formulacion" },
  { grupo: "EN_REVISION",    opcion: "Enviados para aprobación", chip: "Enviados para Aprobación", campoResumen: "en_revision" },
  { grupo: "APROBADOS",      opcion: "Aprobados",               chip: "Aprobados",              campoResumen: "aprobados" },
];

// ── Tarjetas KPI ────────────────────────────────────────────
export interface IndicadorFormulacion {
  titulo: string;
  campoResumen: keyof ResumenFormulacionPlanes;
  subtitulo: string;
  icono: string;
  nota: string;
  notaIcono: string;
  variante: VarianteTarjetaIndicador;
}

export const indicadoresFormulacion: IndicadorFormulacion[] = [
  {
    titulo: "Auditorías finalizadas",
    campoResumen: "auditorias_finalizadas",
    subtitulo: "Vigencia seleccionada",
    icono: "fact_check",
    nota: "100% Fase Informe Final",
    notaIcono: "verified",
    variante: "neutral",
  },
  {
    titulo: "Planes sin formular",
    campoResumen: "sin_formular",
    subtitulo: "Pendientes",
    icono: "priority_high",
    nota: "Requieren atención",
    notaIcono: "warning",
    variante: "alerta",
  },
  {
    titulo: "En revisión por auditor",
    campoResumen: "en_revision",
    subtitulo: "En validación",
    icono: "rate_review",
    nota: `Plazo: ${environment.DIAS_REVISION_PLAN_AUDITOR} días`,
    notaIcono: "schedule",
    variante: "primaria",
  },
  {
    titulo: "Planes aprobados",
    campoResumen: "aprobados",
    subtitulo: "En ejecución",
    icono: "task_alt",
    nota: "Con visto bueno OCI",
    notaIcono: "check_circle",
    variante: "exito",
  },
];

// ── Flujo institucional ─────────────────────────────────────
export const descripcionFlujoPlan =
  `Conforme a la metodología institucional, cada dependencia cuenta con ${environment.DIAS_FORMULACION_PLAN} días hábiles ` +
  "a partir de la finalización de Fase III para estructurar causas raíz y acciones de mitigación.";

export const pasosFlujoPlan: PasoFlujo[] = [
  { titulo: "Formulación", descripcion: "Identificación de causa del hallazgo y propuesta de acciones por hallazgo." },
  { titulo: "Revisión Auditor", descripcion: "Validación de coherencia, indicadores, metas y soporte documental oficial." },
  { titulo: "Seguimiento", descripcion: "Cargue periódico de evidencias en el módulo Gestión de Acciones hasta el cierre definitivo." },
];

// ── Tabla ───────────────────────────────────────────────────
/** Acciones de accionesPlanMejoramiento que esta vista ya implementa. */
export const accionesHabilitadas = ["Registrar Plan", "Ver Plan", "Ver Observaciones"];

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
  ["Registrar Plan",    "edit"],
  ["Ver Plan",          "visibility"],
  ["Ver Observaciones", "history"],
]);

export const columnasFormulacion = [
  { columnDef: "numero",              header: "No. Auditoría",                 cell: (f: AuditoriaFormulacionPlan) => f.no_auditoria },
  { columnDef: "vigencia",            header: "Vigencia",                      cell: (f: AuditoriaFormulacionPlan) => f.vigencia_nombre },
  { columnDef: "auditoria",           header: "Auditoría",                     cell: (f: AuditoriaFormulacionPlan) => f.titulo },
  { columnDef: "tipo",                header: "Tipo de Evaluación",            cell: (f: AuditoriaFormulacionPlan) => f.tipo_evaluacion_nombre },
  { columnDef: "auditores_auditoria", header: "Auditor Responsable Auditoría", cell: (f: AuditoriaFormulacionPlan) => unirNombres(f.auditores_auditoria) },
  { columnDef: "auditores_plan",      header: "Auditor Responsable del Plan",  cell: (f: AuditoriaFormulacionPlan) => unirNombres(f.auditores_plan) },
  { columnDef: "dependencia",         header: "Dependencia", cell: (f: AuditoriaFormulacionPlan) => f.dependencia_nombre },
  { columnDef: "estado",              header: "Estado",                        cell: (f: AuditoriaFormulacionPlan) => f.estado_plan_nombre },
  { columnDef: "acciones",            header: "Acciones",                      cell: (_f: AuditoriaFormulacionPlan) => "" },
];

function unirNombres(nombres: string[] | null | undefined): string {
  return nombres?.length ? nombres.join(", ") : "Sin asignar";
}

/** Clase CSS del chip de estado según su grupo. */
export const claseChipPorGrupo: Record<GrupoEstadoPlan, string> = {
  TODOS:          "",
  SIN_FORMULAR:   "estado-sin-formular",
  EN_FORMULACION: "estado-formulacion",
  EN_REVISION:    "estado-revision",
  APROBADOS:      "estado-aprobado",
};
