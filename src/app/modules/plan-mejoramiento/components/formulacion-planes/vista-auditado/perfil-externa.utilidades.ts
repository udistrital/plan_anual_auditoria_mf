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
  PerfilFormulacion,
  TextosVistaFormulacion,
  columnasComunes,
  crearAgrupador,
} from "../compartido/formulacion.utilidades";

const ESTADO = environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO;

// ── Agrupación de estados del plan ──────────────────────────
// La auditoría externa reutiliza el flujo de estados del plan de mejoramiento; cada hallazgo
// pasa de "sin acciones" a "en formulación", "en revisión" y finalmente "aprobado".
type Grupo = "SIN_FORMULAR" | "EN_FORMULACION" | "EN_REVISION" | "APROBADOS";

const estadosPorGrupo: Record<Grupo, number[]> = {
  SIN_FORMULAR:   [ESTADO.SIN_PLAN_MEJORAMIENTO],
  EN_FORMULACION: [ESTADO.CREANDO_PLAN_MEJORAMIENTO, ESTADO.RECHAZADO_PLAN_MEJORAMIENTO],
  EN_REVISION:    [ESTADO.REVISION_PLAN_MEJORAMIENTO_AUDITOR],
  APROBADOS:      [ESTADO.APROBADO_PLAN_MEJORAMIENTO, ESTADO.FIN_PLAN_MEJORAMIENTO],
};

const { estadosDeGrupo, grupoDeEstado } = crearAgrupador(estadosPorGrupo, "SIN_FORMULAR");

/** Clase CSS del chip de estado según su grupo. */
const claseChipPorGrupo: Record<Grupo, string> = {
  SIN_FORMULAR:   "estado-sin-formular",
  EN_FORMULACION: "estado-formulacion",
  EN_REVISION:    "estado-revision",
  APROBADOS:      "estado-aprobado",
};

// ── Filtro de estado: select "Estado Plan" y chips de acceso rápido ──
const opcionesEstadoPlan: OpcionEstadoPlan<Grupo, ResumenFormulacionPlanes>[] = [
  { grupo: "TODOS",          opcion: "Todos los estados",       chip: "Todos",                    campoResumen: null },
  { grupo: "SIN_FORMULAR",   opcion: "Sin acciones",            chip: "Sin Acciones",             campoResumen: "sin_formular" },
  { grupo: "EN_FORMULACION", opcion: "En formulación",          chip: "En Formulación",           campoResumen: "en_formulacion" },
  { grupo: "EN_REVISION",    opcion: "Enviados para aprobación", chip: "Enviados para Aprobación", campoResumen: "en_revision" },
  { grupo: "APROBADOS",      opcion: "Aprobados",               chip: "Aprobados",                campoResumen: "aprobados" },
];

// ── Tarjetas KPI ────────────────────────────────────────────
const indicadoresExterna: IndicadorFormulacion<ResumenFormulacionPlanes>[] = [
  {
    titulo: "Auditorías externas finalizadas",
    valor: (r) => r.auditorias_finalizadas,
    subtitulo: "Vigencia seleccionada",
    icono: "fact_check",
    nota: "Con hallazgos asignados a la dependencia",
    notaIcono: "verified",
    variante: "neutral",
  },
  {
    titulo: "Hallazgos sin acciones",
    valor: (r) => r.sin_formular,
    subtitulo: "Pendientes",
    icono: "priority_high",
    nota: "Requieren formulación de acciones",
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
    titulo: "Acciones aprobadas",
    valor: (r) => r.aprobados,
    subtitulo: "En ejecución",
    icono: "task_alt",
    nota: "Con visto bueno OCI",
    notaIcono: "check_circle",
    variante: "exito",
  },
];

// ── Textos y flujo institucional ────────────────────────────
const textosExterna: TextosVistaFormulacion = {
  titulo: "Registro de Acciones de Mejora — Auditoría Externa",
  etiqueta: "Auditoría Externa",
  descripcion:
    "Consulte los hallazgos asignados a su dependencia por la auditoría externa y registre, por cada hallazgo, " +
    "las acciones de mejora propuestas junto con sus indicadores.",
  tituloTabla: "Hallazgos de Auditoría Externa",
  tituloFlujo: "Flujo de Formulación de Acciones — Auditoría Externa",
  tooltipFlujo: "Conozca las etapas del registro de acciones de mejora",
  nombreExportacion: "Acciones_Mejora_Auditoria_Externa",
};

const flujoExterna: ConfigFlujo = {
  descripcion:
    "La dependencia auditada complementa cada hallazgo registrado por el auditor externo con las acciones de " +
    "mejora propuestas y sus indicadores, dentro de los plazos definidos por la metodología institucional.",
  pasos: [
    { titulo: "Consulta de Hallazgos", descripcion: "Revisión de los hallazgos asignados por la auditoría externa." },
    { titulo: "Formulación de Acciones", descripcion: "Registro de causa, acción, indicador, meta y fechas por hallazgo." },
    { titulo: "Revisión Auditor", descripcion: "Validación de coherencia, indicadores, metas y fechas." },
    { titulo: "Seguimiento", descripcion: "Cargue periódico de evidencias hasta el cierre definitivo." },
  ],
};

// ── Tabla ───────────────────────────────────────────────────
/** Acciones de accionesPlanMejoramiento que este perfil implementa. */
const accionesHabilitadas = ["Registrar Plan", "Ver Plan", "Ver Observaciones"];

const columnasExterna: ColumnaFormulacion<AuditoriaFormulacionPlan>[] = [
  columnasComunes.numero,
  columnasComunes.vigencia,
  columnasComunes.auditoria,
  columnasComunes.tipo,
  columnasComunes.auditores_auditoria,
  columnasComunes.dependencia,
  columnasComunes.estado,
  columnasComunes.acciones,
];

// ── Perfil de Auditoría Externa ─────────────────────────────
/** Toda la configuración de la vista auditado para Auditoría Externa (issue 1). */
export const perfilExterna: PerfilFormulacion<AuditoriaFormulacionPlan, ResumenFormulacionPlanes, Grupo> = {
  tipoEvaluacionId:     environment.TIPO_EVALUACION.AUDITORIA_EXTERNA_ID,
  nombreTipoEvaluacion: "Auditoría Externa",
  textos:               textosExterna,
  flujo:                flujoExterna,
  indicadores:          indicadoresExterna,
  opcionesEstadoPlan:   opcionesEstadoPlan,
  columnas:             columnasExterna,
  estadosDeGrupo:       estadosDeGrupo,
  claseEstado:          (estadoId) => claseChipPorGrupo[grupoDeEstado(estadoId)],
  accionesHabilitadas:  accionesHabilitadas,
};
