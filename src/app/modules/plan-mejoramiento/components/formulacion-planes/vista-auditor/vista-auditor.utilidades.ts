import { environment } from "src/environments/environment";
import { calcularFechaFinHabiles, contarDiasHabiles } from "src/app/shared/utils/dias-habiles.util";
import type {
  AuditoriaFormulacionAuditor,
  ResumenFormulacionAuditor,
} from "src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models";
import {
  ColumnaFormulacion,
  ConfigFlujo,
  ConTodos,
  IndicadorFormulacion,
  OpcionAlcance,
  OpcionEstadoPlan,
  TextosVistaFormulacion,
  columnasComunes,
  crearAgrupador,
} from "../compartido/formulacion.utilidades";

const ESTADO = environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO;

// ── Agrupación de estados del plan ──────────────────────────
/** A diferencia del auditado, los planes rechazados van aparte: tienen observaciones del auditor. */
export type GrupoAuditor = "SIN_FORMULAR" | "EN_FORMULACION" | "EN_REVISION" | "CON_OBSERVACIONES" | "APROBADOS";
export type GrupoEstadoAuditor = ConTodos<GrupoAuditor>;

export const estadosPorGrupoAuditor: Record<GrupoAuditor, number[]> = {
  SIN_FORMULAR:      [ESTADO.SIN_PLAN_MEJORAMIENTO],
  EN_FORMULACION:    [ESTADO.CREANDO_PLAN_MEJORAMIENTO],
  EN_REVISION:       [ESTADO.REVISION_PLAN_MEJORAMIENTO_AUDITOR],
  CON_OBSERVACIONES: [ESTADO.RECHAZADO_PLAN_MEJORAMIENTO],
  APROBADOS:         [ESTADO.APROBADO_PLAN_MEJORAMIENTO, ESTADO.FIN_PLAN_MEJORAMIENTO],
};

export const { estadosDeGrupo, grupoDeEstado } = crearAgrupador(estadosPorGrupoAuditor, "SIN_FORMULAR");

/** Clase CSS del chip de estado según su grupo. */
export const claseChipPorGrupoAuditor: Record<GrupoAuditor, string> = {
  SIN_FORMULAR:      "estado-sin-formular",
  EN_FORMULACION:    "estado-formulacion",
  EN_REVISION:       "estado-revision",
  CON_OBSERVACIONES: "estado-rechazado",
  APROBADOS:         "estado-aprobado",
};

// ── Filtro de estado: select "Estado Plan" y chips de acceso rápido ──
export const opcionesEstadoAuditor: OpcionEstadoPlan<GrupoAuditor, ResumenFormulacionAuditor>[] = [
  { grupo: "TODOS",             opcion: "Todos los estados",      chip: "Todos",             campoResumen: "total_auditorias" },
  { grupo: "EN_REVISION",       opcion: "Pendientes de revisión", chip: "Pendientes",        campoResumen: "en_revision" },
  { grupo: "CON_OBSERVACIONES", opcion: "Con observaciones",      chip: "Con Observaciones", campoResumen: "con_observaciones" },
  { grupo: "EN_FORMULACION",    opcion: "En formulación",         chip: "En Formulación",    campoResumen: "en_formulacion" },
  { grupo: "SIN_FORMULAR",      opcion: "Sin plan registrado",    chip: "Sin Plan",          campoResumen: "sin_formular" },
  { grupo: "APROBADOS",         opcion: "Aprobados",              chip: "Aprobados",         campoResumen: "aprobados" },
];

// ── Selector de alcance ─────────────────────────────────────
export type AlcanceAuditor = "asignadas" | "todas";

/** Solo estos roles pueden consultar todas las auditorías de la institución. */
export const rolesVenTodas: string[] = [environment.ROL.JEFE, environment.ROL.AUDITOR_EXPERTO];

export const opcionesAlcanceAuditor: OpcionAlcance<ResumenFormulacionAuditor>[] = [
  { valor: "asignadas", etiqueta: "Mis auditorías asignadas",    campoResumen: "total_asignadas" },
  { valor: "todas",     etiqueta: "Todas las de la institución", campoResumen: "total_institucion" },
];

// ── Tarjetas KPI ────────────────────────────────────────────
export const indicadoresAuditor: IndicadorFormulacion<ResumenFormulacionAuditor>[] = [
  {
    titulo: "Planes pendientes de revisión",
    valor: (r) => r.en_revision,
    subtitulo: "Bandeja de entrada",
    icono: "hourglass_top",
    nota: `Plazo de revisión: ${environment.DIAS_REVISION_PLAN_AUDITOR} días hábiles`,
    notaIcono: "schedule",
    variante: "primaria",
  },
  {
    titulo: "En formulación",
    valor: (r) => r.sin_formular + r.en_formulacion,
    subtitulo: "En dependencias",
    icono: "pending_actions",
    nota: "Incluye auditorías sin plan",
    notaIcono: "edit_note",
    variante: "neutral",
  },
  {
    titulo: "Con observaciones",
    valor: (r) => r.con_observaciones,
    subtitulo: "En subsanación",
    icono: "feedback",
    nota: `Plazo de ajustes: ${environment.DIAS_FORMULACION_PLAN} días hábiles`,
    notaIcono: "warning",
    variante: "alerta",
  },
  {
    titulo: "Planes aprobados",
    valor: (r) => r.aprobados,
    subtitulo: "Viabilidad técnica",
    icono: "task_alt",
    nota: "Concepto favorable",
    notaIcono: "verified",
    variante: "exito",
  },
];

// ── Textos y flujo metodológico ─────────────────────────────
export const textosAuditor: TextosVistaFormulacion = {
  titulo: "Bandeja de Revisión y Dictamen de Planes",
  etiqueta: "Rol Auditor OCI • Revisión y Dictamen",
  descripcion:
    "Gestión y evaluación técnica de los planes de mejoramiento remitidos por las dependencias académicas y " +
    "administrativas. Emita conceptos de viabilidad causal, formule observaciones de ajuste o efectúe la aprobación definitiva.",
  tituloTabla: "Planes de Mejoramiento por Auditoría",
  tituloFlujo: "Flujo Metodológico de Evaluación y Dictamen OCI",
  tooltipFlujo: "Conozca las etapas de evaluación y dictamen del plan",
  nombreExportacion: "Revision_Planes",
};

export const flujoAuditor: ConfigFlujo = {
  descripcion:
    "El rol Auditor OCI garantiza la correspondencia causal según las metodologías institucionales antes de otorgar el visto bueno.",
  pasos: [
    {
      titulo: "Recepción y Asignación",
      descripcion:
        `Verificación de radicación formal dentro de los ${environment.DIAS_FORMULACION_PLAN} días hábiles ` +
        "y concordancia con los hallazgos de Fase III.",
    },
    {
      titulo: "Evaluación",
      descripcion: "Análisis de causas raíz declaradas, indicadores de logro cuantificables y viabilidad de fechas de entrega.",
    },
    {
      titulo: "Dictamen & Decisión",
      descripcion: "Emisión de observaciones técnicas de subsanación o Aprobación Definitiva.",
    },
  ],
};

// ── Fecha y plazo ───────────────────────────────────────────
export interface PlazoPlan {
  fecha: string;
  detalle: string;
  icono: string;
  clase: string;
}

function formatearFecha(fecha: Date): string {
  const dd = String(fecha.getDate()).padStart(2, "0");
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${fecha.getFullYear()}`;
}

function textoDias(dias: number): string {
  return dias === 1 ? "1 día hábil" : `${dias} días hábiles`;
}

/** Días hábiles que le quedan al plazo que empezó en `desde`. */
function plazoRestante(desde: Date, dias: number, hoy: Date, vigente: (restantes: number) => string): Omit<PlazoPlan, "fecha"> {
  const restantes = contarDiasHabiles(hoy, calcularFechaFinHabiles(desde, dias));
  if (restantes < 0) {
    return { detalle: `Vencido hace ${textoDias(-restantes)}`, icono: "notification_important", clase: "plazo-vencido" };
  }
  if (restantes === 0) {
    return { detalle: "Vence hoy", icono: "notification_important", clase: "plazo-vencido" };
  }
  return { detalle: vigente(restantes), icono: "timer", clase: "plazo-vigente" };
}

/**
 * Fecha del estado actual del plan y su plazo: revisión del auditor, ajustes de la
 * dependencia tras un rechazo o el dictamen ya emitido. null si el estado no tiene plazo.
 */
export function calcularPlazo(fila: AuditoriaFormulacionAuditor, hoy: Date = new Date()): PlazoPlan | null {
  if (!fila.fecha_estado) return null;
  const fechaEstado = new Date(fila.fecha_estado);
  const fecha = formatearFecha(fechaEstado);

  switch (grupoDeEstado(fila.estado_plan_id)) {
    case "EN_REVISION":
      return {
        fecha: `Rad: ${fecha}`,
        ...plazoRestante(fechaEstado, environment.DIAS_REVISION_PLAN_AUDITOR, hoy, (n) => `${textoDias(n)} ${n === 1 ? "restante" : "restantes"}`),
      };
    case "CON_OBSERVACIONES":
      return {
        fecha: `Devuelto: ${fecha}`,
        ...plazoRestante(fechaEstado, environment.DIAS_FORMULACION_PLAN, hoy, (n) => `Vence: ${textoDias(n)} (ajustes)`),
      };
    case "APROBADOS":
      return { fecha: `Aprobado: ${fecha}`, detalle: "Dictamen formal emitido", icono: "verified", clase: "plazo-cumplido" };
    default:
      return null;
  }
}

// ── Tabla ───────────────────────────────────────────────────
/** Acciones de accionesPlanMejoramiento que esta vista implementa. */
export const accionesHabilitadasAuditor = ["Asignar Auditor(es)", "Ver Plan", "Ver Observaciones"];

/** Roles que pueden aprobar o rechazar el plan en ver-plan (ver VerPlanComponent.mostrarAccionesRevision). */
export const rolesDictamen: string[] = [environment.ROL.JEFE, environment.ROL.AUDITOR_EXPERTO, environment.ROL.AUDITOR];

export const columnasAuditor: ColumnaFormulacion<AuditoriaFormulacionAuditor>[] = [
  columnasComunes.numero,
  columnasComunes.vigencia,
  columnasComunes.auditoria,
  columnasComunes.tipo,
  columnasComunes.dependencia,
  columnasComunes.auditores_auditoria,
  columnasComunes.auditores_plan,
  {
    columnDef: "plazo",
    header: "Fecha Radicación y Plazo",
    cell: (f) => {
      const plazo = calcularPlazo(f);
      return plazo ? `${plazo.fecha} · ${plazo.detalle}` : "";
    },
  },
  columnasComunes.estado,
  columnasComunes.acciones,
];
