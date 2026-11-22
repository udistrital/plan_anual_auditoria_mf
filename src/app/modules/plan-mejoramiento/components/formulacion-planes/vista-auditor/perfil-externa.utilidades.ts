import { environment } from "src/environments/environment";
import type {
  AuditoriaFormulacionAuditor,
  ResumenFormulacionAuditor,
} from "src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models";
import {
  ColumnaFormulacion,
  ConfigFlujo,
  IndicadorFormulacion,
  OpcionEstadoPlan,
  PerfilFormulacion,
  TextosVistaFormulacion,
  columnasComunes,
  crearAgrupador,
} from "../compartido/formulacion.utilidades";
import {
  GrupoAuditor,
  calcularPlazo,
} from "./vista-auditor.utilidades";

const ESTADO = environment.AUDITORIA_ESTADO.PLAN_MEJORAMIENTO;

// ── Agrupación de estados del plan ──────────────────────────
// La revisión externa es incremental: el auditor dictamina acciones a medida que llegan. La
// agrupación de estados del plan se mantiene (misma máquina de estados), con etiquetas orientadas
// al dictamen progresivo. (Issue 2)
const estadosPorGrupoExterno: Record<GrupoAuditor, number[]> = {
  SIN_FORMULAR:      [ESTADO.SIN_PLAN_MEJORAMIENTO],
  EN_FORMULACION:    [ESTADO.CREANDO_PLAN_MEJORAMIENTO],
  EN_REVISION:       [ESTADO.REVISION_PLAN_MEJORAMIENTO_AUDITOR],
  CON_OBSERVACIONES: [ESTADO.RECHAZADO_PLAN_MEJORAMIENTO],
  APROBADOS:         [ESTADO.APROBADO_PLAN_MEJORAMIENTO, ESTADO.FIN_PLAN_MEJORAMIENTO],
};

const { estadosDeGrupo, grupoDeEstado } = crearAgrupador(estadosPorGrupoExterno, "SIN_FORMULAR");

/** Clase CSS del chip de estado según su grupo. */
const claseChipPorGrupoExterno: Record<GrupoAuditor, string> = {
  SIN_FORMULAR:      "estado-sin-formular",
  EN_FORMULACION:    "estado-formulacion",
  EN_REVISION:       "estado-revision",
  CON_OBSERVACIONES: "estado-rechazado",
  APROBADOS:         "estado-aprobado",
};

// ── Filtro de estado: select "Estado Plan" y chips de acceso rápido ──
const opcionesEstadoExterno: OpcionEstadoPlan<GrupoAuditor, ResumenFormulacionAuditor>[] = [
  { grupo: "TODOS",             opcion: "Todos los estados",       chip: "Todos",             campoResumen: "total_auditorias" },
  { grupo: "EN_REVISION",       opcion: "Acciones por dictaminar", chip: "Por Dictaminar",    campoResumen: "en_revision" },
  { grupo: "CON_OBSERVACIONES", opcion: "Con observaciones",       chip: "Con Observaciones", campoResumen: "con_observaciones" },
  { grupo: "EN_FORMULACION",    opcion: "En formulación",          chip: "En Formulación",    campoResumen: "en_formulacion" },
  { grupo: "SIN_FORMULAR",      opcion: "Sin acciones recibidas",  chip: "Sin Acciones",      campoResumen: "sin_formular" },
  { grupo: "APROBADOS",         opcion: "Aprobados",               chip: "Aprobados",         campoResumen: "aprobados" },
];

// ── Tarjetas KPI ────────────────────────────────────────────
const indicadoresExterno: IndicadorFormulacion<ResumenFormulacionAuditor>[] = [
  {
    titulo: "Acciones por dictaminar",
    valor: (r) => r.en_revision,
    subtitulo: "Recepción incremental",
    icono: "hourglass_top",
    nota: "Dictamen individual por acción",
    notaIcono: "schedule",
    variante: "primaria",
  },
  {
    titulo: "En formulación",
    valor: (r) => r.sin_formular + r.en_formulacion,
    subtitulo: "En dependencias",
    icono: "pending_actions",
    nota: "Aún sin remitir a revisión",
    notaIcono: "edit_note",
    variante: "neutral",
  },
  {
    titulo: "Con observaciones",
    valor: (r) => r.con_observaciones,
    subtitulo: "Devueltas para ajuste",
    icono: "feedback",
    nota: "A la espera del reenvío de la dependencia",
    notaIcono: "warning",
    variante: "alerta",
  },
  {
    titulo: "Consolidados",
    valor: (r) => r.aprobados,
    subtitulo: "Acciones aprobadas en firme",
    icono: "task_alt",
    nota: "Consolidación progresiva",
    notaIcono: "verified",
    variante: "exito",
  },
];

// ── Textos y flujo metodológico ─────────────────────────────
const textosExterno: TextosVistaFormulacion = {
  titulo: "Revisión y Dictamen de Acciones — Auditoría Externa",
  etiqueta: "Rol Auditor OCI • Dictamen Incremental",
  descripcion:
    "Revise y dictamine de forma individual e incremental las acciones remitidas por las dependencias " +
    "auditadas en auditorías externas, sin esperar a que todas finalicen la formulación. Apruebe o " +
    "devuelva cada acción con observaciones para agilizar la consolidación del plan.",
  tituloTabla: "Acciones de Mejora por Auditoría Externa",
  tituloFlujo: "Flujo de Revisión Incremental — Auditoría Externa",
  tooltipFlujo: "Conozca el dictamen individual e incremental de las acciones",
  nombreExportacion: "Revision_Acciones_Auditoria_Externa",
};

const flujoExterno: ConfigFlujo = {
  descripcion:
    "En auditorías externas el auditor dictamina cada acción conforme la recibe, sin bloqueo por las " +
    "demás dependencias, consolidando progresivamente las acciones aprobadas.",
  pasos: [
    {
      titulo: "Recepción incremental",
      descripcion: "Las acciones llegan a revisión a medida que cada dependencia las remite.",
    },
    {
      titulo: "Dictamen individual",
      descripcion: "Aprobación o devolución con observaciones de cada acción, de forma independiente.",
    },
    {
      titulo: "Consolidación progresiva",
      descripcion: "Las acciones aprobadas quedan en firme y consolidan el plan sin esperar al resto.",
    },
  ],
};

// ── Tabla ───────────────────────────────────────────────────
/** Acciones de accionesPlanMejoramiento que este perfil implementa. */
const accionesHabilitadasExterno = ["Asignar Auditor(es)", "Ver Plan", "Ver Documentos Auditoría", "Ver Observaciones"];

const columnasExterno: ColumnaFormulacion<AuditoriaFormulacionAuditor>[] = [
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

// ── Perfil de Auditoría Externa (revisión incremental) ──────
/** Toda la configuración de la vista auditor para Auditoría Externa (issue 2). */
export const perfilAuditorExterna: PerfilFormulacion<AuditoriaFormulacionAuditor, ResumenFormulacionAuditor, GrupoAuditor> = {
  tipoEvaluacionId:     environment.TIPO_EVALUACION.AUDITORIA_EXTERNA_ID,
  nombreTipoEvaluacion: "Auditoría Externa",
  textos:               textosExterno,
  flujo:                flujoExterno,
  indicadores:          indicadoresExterno,
  opcionesEstadoPlan:   opcionesEstadoExterno,
  columnas:             columnasExterno,
  estadosDeGrupo:       estadosDeGrupo,
  claseEstado:          (estadoId) => claseChipPorGrupoExterno[grupoDeEstado(estadoId)],
  accionesHabilitadas:  accionesHabilitadasExterno,
};
