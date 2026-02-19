import { Formulario } from "src/app/shared/data/models/formulario.model";
import { environment } from "src/environments/environment";

export const formularioInformacionAuditoria: Formulario = {
  campos: [
    {
      nombre: "no_auditoria",
      descripcion: "No Auditoría y/o seguimiento",
      etiqueta: "No Auditoría y/o seguimiento",
      icono: "format_list_numbered",
      tipo: "number",
      placeholder: "Escriba aquí el número de la auditoría",
      deshabilitado: false,
      validaciones: [{ tipo: "requerido", valor: "" }],
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "consecutivo_OCI",
      etiqueta: "Consecutivo OCI",
      icono: "bookmark",
      tipo: "text",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "consecutivo_IE",
      etiqueta: "Consecutivo IE",
      icono: "bookmark_border",
      tipo: "text",
      validaciones: [
        { tipo: "requerido", valor: "" },
        { tipo: "maxLength", valor: "30" },
      ],
      deshabilitado: false,
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "macroproceso",
      etiqueta: "Macroproceso",
      icono: "account_tree",
      tipo: "text",
      deshabilitado: true,
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "proceso",
      etiqueta: "Proceso",
      icono: "account_tree",
      tipo: "text",
      deshabilitado: true,
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "dependencia",
      etiqueta: "Dependencia",
      icono: "apartment",
      tipo: "text",
      deshabilitado: true,
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "lider",
      etiqueta: "Líder",
      icono: "person",
      tipo: "select",
      validaciones: [{ tipo: "requerido", valor: "" }],
      parametros: {
        //vacio porque se llena en el componente editar auditoria
      },
      deshabilitado: false,
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "responsable",
      etiqueta: "Responsable",
      icono: "supervisor_account",
      tipo: "select",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      parametros: {
        //vacio porque se llena en el componente editar auditoria
      },
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "correo_dependencia",
      etiqueta: "Correo Dependencia",
      icono: "email",
      tipo: "email",
      deshabilitado: true,
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "correo_lider",
      etiqueta: "Correo Jefe dependencia",
      icono: "email",
      tipo: "email",
      deshabilitado: true,
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "correo_responsable",
      etiqueta: "Correo Asistente dependencia",
      icono: "email",
      tipo: "email",
      deshabilitado: true,
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "correo_complementario",
      etiqueta: "Correo Complementario",
      icono: "email",
      tipo: "email",
      validaciones: [{ tipo: "email", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "fecha_ejecucion_inicial",
      etiqueta: "Fecha de Ejecución Inicial",
      icono: "event",
      parametros: {
        vista: "year",
        fecha_inicio: "2024-01-01T05:00:00.000Z",
      },
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      tipo: "date",
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "fecha_ejecucion_final",
      etiqueta: "Fecha de Ejecución Final",
      icono: "event_available",
      parametros: {
        vista: "year",
        fecha_inicio: "2024-01-01T05:00:00.000Z",
      },
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      tipo: "date",
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "objetivo_auditoria",
      etiqueta: "Objetivo de la Auditoría",
      icono: "flag",
      tipo: "textarea",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
    },
    {
      nombre: "alcance_auditoria",
      etiqueta: "Alcance de la Auditoría",
      icono: "visibility",
      tipo: "textarea",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
    },
    {
      nombre: "criterios",
      etiqueta: "Criterios",
      icono: "check_circle",
      tipo: "textarea",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
    },
  ],
};

export const formularioRecursosAuditoria: Formulario = {
  campos: [
    {
      nombre: "tecnologicos",
      etiqueta: "Tecnológicos",
      tipo: "textarea",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
    },
    {
      nombre: "humanos",
      etiqueta: "Humanos",
      tipo: "textarea",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
    },
    {
      nombre: "fisicos",
      etiqueta: "Fisicos",
      tipo: "textarea",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
    },
  ],
};

export const formularioTemasAuditoria: Formulario = {
  campos: [
    {
      nombre: "temas",
      etiqueta: "Temas",
      tipo: "textarea",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
    }
  ]
}
