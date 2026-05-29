import { Formulario } from "src/app/shared/data/models/formulario.model";

export const formularioInformacionAuditoria: Formulario = {
  campos: [
    {
      nombre: "consecutivo_no_auditoria",
      etiqueta: "No Auditoría",
      tipo: "text",
      deshabilitado: true,
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "tipo_evaluacion",
      etiqueta: "Tipo Evaluación",
      tipo: "text",
      deshabilitado: true,
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "titulo",
      etiqueta: "Nombre Auditoría",
      tipo: "text",
      deshabilitado: true,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
    },
    {
      nombre: "numero_hallazgo",
      etiqueta: "No Hallazgo",
      tipo: "text",
      deshabilitado: true,
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "descripcion_hallazgo",
      etiqueta: "Descripción del Hallazgo",
      tipo: "textarea",
      deshabilitado: true,
      parametros: {
        altura: 100,
      },
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
    },
    {
      nombre: "causa_hallazgo",
      etiqueta: "Causa del Hallazgo",
      tipo: "textarea",
      deshabilitado: true,
      parametros: {
        altura: 140,
      },
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
    },
  ]
}

export const formularioInformacionAccion: Formulario = {
  campos: [
    {
      nombre: "no_accion",
      etiqueta: "No Acción",
      tipo: "text",
      deshabilitado: true,
      claseGrid: "col-lg-3 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "tipo_accion",
      etiqueta: "Tipo de Acción",
      tipo: "text",
      deshabilitado: true,
      claseGrid: "col-lg-3 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "fecha_inicio",
      etiqueta: "Fecha Inicio",
      tipo: "date",
      deshabilitado: true,
      claseGrid: "col-lg-3 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "fecha_fin",
      etiqueta: "Fecha Fin",
      tipo: "date",
      deshabilitado: true,
      claseGrid: "col-lg-3 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "nombre_indicador",
      etiqueta: "Nombre Indicador",
      tipo: "text",
      deshabilitado: true,
      claseGrid: "col-lg-5 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "formula_indicador",
      etiqueta: "Fórmula de Indicador",
      tipo: "text",
      deshabilitado: true,
      claseGrid: "col-lg-5 col-md-5 col-sm-12 col-xs-12",
    },
    {
      nombre: "meta",
      etiqueta: "Meta %",
      tipo: "number",
      deshabilitado: true,
      claseGrid: "col-lg-2 col-md-1 col-sm-12 col-xs-12",
    },
    {
      nombre: "descripcion",
      etiqueta: "Acción",
      tipo: "textarea",
      deshabilitado: true,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
    },
    {
      nombre: "auditor",
      etiqueta: "Auditor Responsable Plan",
      tipo: "text",
      deshabilitado: true,
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
  ]
}

export const formularioDependencias: Formulario = {
  campos: [
    {
      nombre: "jefe_nombre",
      etiqueta: "Jefe dependencia",
      icono: "person",
      tipo: "text",
      deshabilitado: true,
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "asistente_nombre",
      etiqueta: "Asistente dependencia",
      icono: "supervisor_account",
      tipo: "text",
      deshabilitado: true,
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
  ]
}

export const formularioDependencias2: Formulario = {
  campos: [
    ...formularioDependencias.campos || [],
    {
      nombre: "dependencia_apoyo",
      etiqueta: "Dependencia de apoyo",
      icono: "person",
      tipo: "text",
      deshabilitado: true,
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
  ]
}
