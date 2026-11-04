import { environment } from "src/environments/environment";
import type { AccionGestion, GrupoAccion, ResumenGestionAcciones } from "src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models";
import { VarianteTarjetaIndicador } from "src/app/shared/elements/components/tarjeta-indicador/tarjeta-indicador.component";

export type FiltroGrupo = GrupoAccion | "EN_RIESGO" | "TODOS";

/** Roles auditor que ven todas las acciones (mismo criterio que Formulación). */
export const rolesVenTodasAcciones: string[] = [environment.ROL.JEFE, environment.ROL.AUDITOR_EXPERTO];

export interface ChipGrupo {
  grupo: FiltroGrupo;
  etiqueta: string;
  campoResumen: keyof ResumenGestionAcciones;
  riesgo?: boolean;
}

export const chipsGrupo: ChipGrupo[] = [
  { grupo: "TODOS",               etiqueta: "Todas",                  campoResumen: "total" },
  { grupo: "PENDIENTE_HABILITAR", etiqueta: "Pendiente de habilitar", campoResumen: "pendiente_habilitar" },
  { grupo: "CARGUE_ABIERTO",      etiqueta: "Cargue abierto",         campoResumen: "cargue_abierto" },
  { grupo: "EN_REVISION",         etiqueta: "En revisión OCI",        campoResumen: "en_revision" },
  { grupo: "CALIFICADAS",         etiqueta: "Calificadas",            campoResumen: "calificadas" },
  { grupo: "EN_RIESGO",           etiqueta: "En riesgo",              campoResumen: "en_riesgo", riesgo: true },
];

/** Texto y clase del chip de estado de cada fila (clases de formulacion-planes.css). */
export const estadoPorGrupo: Record<GrupoAccion, { texto: string; clase: string }> = {
  PENDIENTE_HABILITAR: { texto: "Pendiente de habilitar", clase: "estado-sin-formular" },
  CARGUE_ABIERTO:      { texto: "Cargue abierto",         clase: "estado-formulacion" },
  EN_REVISION:         { texto: "En revisión OCI",        clase: "estado-revision" },
  CALIFICADAS:         { texto: "Calificada",             clase: "estado-aprobado" },
};

export interface IndicadorGestion {
  titulo: string;
  valor: (r: ResumenGestionAcciones) => number;
  subtitulo: string;
  icono: string;
  nota: (r: ResumenGestionAcciones) => string;
  notaIcono: string;
  variante: VarianteTarjetaIndicador;
}

export function porcentaje(parte: number, total: number): number {
  return total ? Math.round((parte / total) * 1000) / 10 : 0;
}

export const indicadoresGestion: IndicadorGestion[] = [
  { titulo: "Acciones aprobadas", valor: (r) => r.total,          subtitulo: "Totales",      icono: "assignment_turned_in", nota: (r) => `${r.calificadas} calificadas`,                     notaIcono: "task_alt",    variante: "neutral" },
  { titulo: "Cargue abierto",     valor: (r) => r.cargue_abierto, subtitulo: "En ejecución", icono: "upload_file",          nota: (r) => `${r.en_riesgo} en riesgo de vencimiento`,          notaIcono: "warning",     variante: "alerta" },
  { titulo: "En revisión OCI",    valor: (r) => r.en_revision,    subtitulo: "Radicadas",    icono: "pending_actions",      nota: (r) => `${r.pendiente_habilitar} pendientes de habilitar`, notaIcono: "lock",        variante: "primaria" },
  { titulo: "Eficaces (≥80%)",    valor: (r) => r.eficaces,       subtitulo: "Dictaminadas", icono: "verified",             nota: (r) => `${porcentaje(r.eficaces, r.total)}% del total`,    notaIcono: "trending_up", variante: "exito" },
];

export interface BotonFila {
  etiqueta: "Registrar Avances" | "Ver Calificación" | "Ver Acción" | "Habilitar Cargue" | "Calificar";
  icono: string;
  primario: boolean;
}

const botones = {
  registrarAvances: { etiqueta: "Registrar Avances", icono: "edit_document", primario: true },
  habilitarCargue:  { etiqueta: "Habilitar Cargue",  icono: "lock_open",     primario: true },
  calificar:        { etiqueta: "Calificar",         icono: "rate_review",   primario: true },
  verCalificacion:  { etiqueta: "Ver Calificación",  icono: "verified",      primario: false },
  verAccion:        { etiqueta: "Ver Acción",        icono: "visibility",    primario: false },
} satisfies Record<string, BotonFila>;

/** Botón visible por fila en la vista del auditado. */
export function botonAuditado(fila: AccionGestion): BotonFila {
  if (fila.grupo === "CARGUE_ABIERTO") return botones.registrarAvances;
  if (fila.grupo === "CALIFICADAS") return botones.verCalificacion;
  return botones.verAccion;
}

/** Botón visible por fila en la vista del auditor; habilitar y calificar solo al auditor del plan. */
export function botonAuditor(fila: AccionGestion): BotonFila {
  if (fila.auditor_plan_asignado && fila.grupo === "PENDIENTE_HABILITAR") return botones.habilitarCargue;
  if (fila.auditor_plan_asignado && fila.grupo === "EN_REVISION") return botones.calificar;
  if (fila.grupo === "CALIFICADAS") return botones.verCalificacion;
  return botones.verAccion;
}

/** Texto de la columna Cronograma: null si la acción no está en riesgo o no tiene fecha_fin. */
export function textoVencimiento(fila: AccionGestion): { texto: string; clase: string } | null {
  const dias = fila.dias_para_vencer;
  if (dias === null || !fila.en_riesgo) return null;

  if (dias < 0) return { texto: `Vencida hace ${-dias} día(s)`, clase: "plazo-vencido" };
  return { texto: dias === 0 ? "Vence hoy" : `Vence en ${dias} día(s)`, clase: "plazo-vencido" };
}

export const pluralSoportes: Record<string, string> = { "=0": "Sin soportes", "=1": "# soporte", other: "# soportes" };

export interface TextosVistaGestion {
  titulo: string;
  descripcion: string;
  tituloTabla: string;
  subtituloTabla: string;
  nombreExportacion: string;
}

export const textosAuditadoGestion: TextosVistaGestion = {
  titulo: "Gestión y Consulta de Acciones de Mejoramiento",
  descripcion:
    "Monitoreo, registro de avances y evaluación de eficacia para acciones formuladas en auditorías internas " +
    "conforme a los lineamientos de la Universidad Distrital Francisco José de Caldas.",
  tituloTabla: "Listado de Acciones Aprobadas en los Planes de Mejoramiento",
  subtituloTabla: "Seleccione una acción para radicar evidencias o consultar las evaluaciones técnicas de la OCI",
  nombreExportacion: "Gestion_Acciones",
};

export const textosAuditorGestion: TextosVistaGestion = {
  titulo: "Seguimiento y Evaluación de Acciones de Mejoramiento",
  descripcion:
    "Habilite el cargue de evidencias, revise los soportes radicados y califique la eficacia de las acciones " +
    "de los planes de mejoramiento aprobados.",
  tituloTabla: "Listado de Acciones Aprobadas en los Planes de Mejoramiento",
  subtituloTabla: "Seleccione una acción para habilitar el cargue, revisar soportes o calificar su eficacia",
  nombreExportacion: "Seguimiento_Acciones",
};

/** Columnas de la tabla (ids de matColumnDef) y encabezados; misma lista en ambas vistas. */
export const columnasGestion = [
  { columnDef: "auditoria",   header: "No. Auditoría" },
  { columnDef: "nombre",      header: "Nombre Auditoría" },
  { columnDef: "hallazgo",    header: "No. Hallazgo" },
  { columnDef: "accion",      header: "No. Acción" },
  { columnDef: "sintesis",    header: "Síntesis de la Acción" },
  { columnDef: "responsable", header: "Responsable" },
  { columnDef: "auditores",   header: "Auditor(es)" },
  { columnDef: "cronograma",  header: "Cronograma" },
  { columnDef: "avance",      header: "Avance / Eficacia" },
  { columnDef: "acciones",    header: "Acciones" },
] as const;

/** Columnas del Excel exportado (sin "acciones"). */
export function filaExportacion(f: AccionGestion): Record<string, unknown> {
  return {
    "No. Auditoría": f.no_auditoria,
    "Nombre Auditoría": f.nombre_auditoria,
    "Tipo de Evaluación": f.tipo_evaluacion_nombre,
    "No. Hallazgo": f.no_hallazgo,
    "Hallazgo": f.descripcion_hallazgo,
    "No. Acción": f.no_accion,
    "Tipo de Acción": f.tipo_accion_nombre,
    "Síntesis de la Acción": f.descripcion_accion,
    "Dependencia Líder": f.dependencia_lider,
    "Dependencias de Apoyo": f.dependencias_apoyo.join(", "),
    "Auditor(es) del Plan": f.auditores_plan.join(", "),
    "Fecha Inicio": f.fecha_inicio ? new Date(f.fecha_inicio).toLocaleDateString("es-CO") : "",
    "Fecha Fin": f.fecha_fin ? new Date(f.fecha_fin).toLocaleDateString("es-CO") : "",
    "Soportes": f.total_soportes,
    "Calificación (%)": f.calificacion ?? "",
    "Estado": estadoPorGrupo[f.grupo].texto,
    "En Riesgo": f.en_riesgo ? "Sí" : "No",
  };
}
