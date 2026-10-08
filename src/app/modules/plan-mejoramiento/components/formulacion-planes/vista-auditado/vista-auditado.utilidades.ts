import { environment } from "src/environments/environment";
import type {
  AuditoriaFormulacionPlan,
  ResumenFormulacionPlanes,
} from "src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models";
import {
  ColumnaFormulacion,
  ConfigFlujo,
  ConTodos,
  IndicadorFormulacion,
  OpcionEstadoPlan,
  TextosVistaFormulacion,
  columnasComunes,
  crearAgrupador,
} from "../compartido/formulacion.utilidades";

export { pluralHallazgos, pluralObservaciones } from "../compartido/formulacion.utilidades";

const ESTADO = environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO;

// ── Agrupación de estados del plan ──────────────────────────
type Grupo = "SIN_FORMULAR" | "EN_FORMULACION" | "EN_REVISION" | "APROBADOS";
export type GrupoEstadoPlan = ConTodos<Grupo>;

export const estadosPorGrupo: Record<Grupo, number[]> = {
  SIN_FORMULAR:   [ESTADO.SIN_PLAN_MEJORAMIENTO],
  EN_FORMULACION: [ESTADO.CREANDO_PLAN_MEJORAMIENTO, ESTADO.RECHAZADO_PLAN_MEJORAMIENTO],
  EN_REVISION:    [ESTADO.REVISION_PLAN_MEJORAMIENTO_AUDITOR],
  APROBADOS:      [ESTADO.APROBADO_PLAN_MEJORAMIENTO, ESTADO.FIN_PLAN_MEJORAMIENTO],
};

export const { estadosDeGrupo, grupoDeEstado } = crearAgrupador(estadosPorGrupo, "SIN_FORMULAR");

// ── Filtro de estado: select "Estado Plan" y chips de acceso rápido ──
export const opcionesEstadoPlan: OpcionEstadoPlan<Grupo, ResumenFormulacionPlanes>[] = [
  { grupo: "TODOS",          opcion: "Todos los estados",       chip: "Todos",                  campoResumen: null },
  { grupo: "SIN_FORMULAR",   opcion: "Sin formular",            chip: "Sin Formular",           campoResumen: "sin_formular" },
  { grupo: "EN_FORMULACION", opcion: "En formulación",          chip: "En Formulación",         campoResumen: "en_formulacion" },
  { grupo: "EN_REVISION",    opcion: "Enviados para aprobación", chip: "Enviados para Aprobación", campoResumen: "en_revision" },
  { grupo: "APROBADOS",      opcion: "Aprobados",               chip: "Aprobados",              campoResumen: "aprobados" },
];

// ── Tarjetas KPI ────────────────────────────────────────────
export const indicadoresFormulacion: IndicadorFormulacion<ResumenFormulacionPlanes>[] = [
  {
    titulo: "Auditorías finalizadas",
    valor: (r) => r.auditorias_finalizadas,
    subtitulo: "Vigencia seleccionada",
    icono: "fact_check",
    nota: "100% Fase Informe Final",
    notaIcono: "verified",
    variante: "neutral",
  },
  {
    titulo: "Planes sin formular",
    valor: (r) => r.sin_formular,
    subtitulo: "Pendientes",
    icono: "priority_high",
    nota: "Requieren atención",
    notaIcono: "warning",
    variante: "alerta",
  },
  {
    titulo: "En revisión por auditor",
    valor: (r) => r.en_revision,
    subtitulo: "En validación",
    icono: "rate_review",
    nota: `Plazo: ${environment.DIAS_REVISION_PLAN_AUDITOR} días`,
    notaIcono: "schedule",
    variante: "primaria",
  },
  {
    titulo: "Planes aprobados",
    valor: (r) => r.aprobados,
    subtitulo: "En ejecución",
    icono: "task_alt",
    nota: "Con visto bueno OCI",
    notaIcono: "check_circle",
    variante: "exito",
  },
];

// ── Textos y flujo institucional ────────────────────────────
export const textosAuditado: TextosVistaFormulacion = {
  titulo: "Registro de Planes de Mejoramiento",
  etiqueta: "Informe Final Finalizado",
  descripcion:
    "Consulte las auditorías concluidas para iniciar, continuar o remitir los planes de mejoramiento " +
    "hacia la Oficina de Control Interno (OCI).",
  tituloTabla: "Auditorías Finalizadas",
  tituloFlujo: "Flujo Institucional del Plan de Mejoramiento",
  tooltipFlujo: "Conozca las etapas y plazos del plan de mejoramiento",
  nombreExportacion: "Formulacion_Planes",
};

export const flujoPlan: ConfigFlujo = {
  descripcion:
    `Conforme a la metodología institucional, cada dependencia cuenta con ${environment.DIAS_FORMULACION_PLAN} días hábiles ` +
    "a partir de la finalización de Fase III para estructurar causas raíz y acciones de mitigación.",
  pasos: [
    { titulo: "Formulación", descripcion: "Identificación de causa del hallazgo y propuesta de acciones por hallazgo." },
    { titulo: "Revisión Auditor", descripcion: "Validación de coherencia, indicadores, metas y soporte documental oficial." },
    { titulo: "Seguimiento", descripcion: "Cargue periódico de evidencias en el módulo Gestión de Acciones hasta el cierre definitivo." },
  ],
};

// ── Tabla ───────────────────────────────────────────────────
/** Acciones de accionesPlanMejoramiento que esta vista ya implementa. */
export const accionesHabilitadas = ["Registrar Plan", "Ver Plan", "Ver Observaciones"];

export const columnasFormulacion: ColumnaFormulacion<AuditoriaFormulacionPlan>[] = [
  columnasComunes.numero,
  columnasComunes.vigencia,
  columnasComunes.auditoria,
  columnasComunes.tipo,
  columnasComunes.auditores_auditoria,
  columnasComunes.auditores_plan,
  columnasComunes.dependencia,
  columnasComunes.estado,
  columnasComunes.acciones,
];

/** Clase CSS del chip de estado según su grupo. */
export const claseChipPorGrupo: Record<Grupo, string> = {
  SIN_FORMULAR:   "estado-sin-formular",
  EN_FORMULACION: "estado-formulacion",
  EN_REVISION:    "estado-revision",
  APROBADOS:      "estado-aprobado",
};
