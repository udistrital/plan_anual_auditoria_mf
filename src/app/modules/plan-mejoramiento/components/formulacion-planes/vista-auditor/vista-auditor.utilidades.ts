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

// ── Alcance de la consulta ──────────────────────────────────
/** Estos roles ven todas las auditorías de la vigencia; los demás, solo las asignadas. */
export const rolesVenTodas: string[] = [environment.ROL.JEFE, environment.ROL.AUDITOR_EXPERTO];

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
  /** Radicación: aprobación del informe final. null si aún no tiene fecha. */
  fecha: string | null;
  detalle: string;
  icono: string;
  clase: string;
}

type DetallePlazo = Omit<PlazoPlan, "fecha">;

function formatearFecha(fecha: Date): string {
  const dd = String(fecha.getDate()).padStart(2, "0");
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${fecha.getFullYear()}`;
}

function textoDias(dias: number): string {
  return dias === 1 ? "1 día hábil" : `${dias} días hábiles`;
}

/** Días hábiles que le quedan al plazo que vence en `fin`, con el texto precedido de `prefijo`. */
function estadoPlazo(prefijo: string, fin: Date, hoy: Date): DetallePlazo {
  const restantes = contarDiasHabiles(hoy, fin);
  if (restantes < 0) {
    return { detalle: `${prefijo}: vencido hace ${textoDias(-restantes)}`, icono: "notification_important", clase: "plazo-vencido" };
  }
  if (restantes === 0) {
    return { detalle: `${prefijo}: vence hoy`, icono: "notification_important", clase: "plazo-vencido" };
  }
  const sufijo = restantes === 1 ? "restante" : "restantes";
  return { detalle: `${prefijo}: ${textoDias(restantes)} ${sufijo}`, icono: "timer", clase: "plazo-vigente" };
}

const sinPlazo = (detalle: string): DetallePlazo => ({ detalle, icono: "radio_button_unchecked", clase: "plazo-pendiente" });

/**
 * Plazo según el estado del plan: formulación hasta fecha_limite, revisión del auditor
 * y ajustes tras un rechazo desde la fecha del estado actual, o el dictamen ya emitido.
 */
function detallePlazo(fila: AuditoriaFormulacionAuditor, hoy: Date): DetallePlazo | null {
  const fechaEstado = fila.fecha_estado ? new Date(fila.fecha_estado) : null;

  switch (grupoDeEstado(fila.estado_plan_id)) {
    case "SIN_FORMULAR":
      return sinPlazo("Sin plan registrado");
    case "EN_FORMULACION": {
      if (!fila.fecha_limite) return sinPlazo("Sin plazo registrado");
      const limite = new Date(fila.fecha_limite);
      return estadoPlazo(`Límite ${formatearFecha(limite)}`, limite, hoy);
    }
    case "EN_REVISION":
      return fechaEstado
        ? estadoPlazo("Revisión", calcularFechaFinHabiles(fechaEstado, environment.DIAS_REVISION_PLAN_AUDITOR), hoy)
        : null;
    case "CON_OBSERVACIONES":
      return fechaEstado
        ? estadoPlazo("Ajustes", calcularFechaFinHabiles(fechaEstado, environment.DIAS_FORMULACION_PLAN), hoy)
        : null;
    case "APROBADOS":
      return {
        detalle: fechaEstado ? `Aprobado ${formatearFecha(fechaEstado)}` : "Plan aprobado",
        icono: "verified",
        clase: "plazo-cumplido",
      };
  }
}

/** Fecha de radicación (aprobación del informe final) y plazo del plan. null si no hay ninguno. */
export function calcularPlazo(fila: AuditoriaFormulacionAuditor, hoy: Date = new Date()): PlazoPlan | null {
  const fecha = fila.fecha_aprobacion_informe ? `Rad: ${formatearFecha(new Date(fila.fecha_aprobacion_informe))}` : null;
  const detalle = detallePlazo(fila, hoy);
  if (!fecha && !detalle) return null;
  return { fecha, ...(detalle ?? { detalle: "", icono: "", clase: "" }) };
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
      return plazo ? [plazo.fecha, plazo.detalle].filter(Boolean).join(" · ") : "";
    },
  },
  columnasComunes.estado,
  columnasComunes.acciones,
];
