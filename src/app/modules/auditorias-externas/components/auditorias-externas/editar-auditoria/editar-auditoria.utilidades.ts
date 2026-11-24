import { Formulario } from "src/app/shared/data/models/formulario.model";
import { environment } from "src/environments/environment";

/** Datos generales de la auditoría externa (#953). */
export const formularioInformacionAuditoria: Formulario = {
  campos: [
    {
      nombre: "codigo_entidad",
      descripcion: "Código de la entidad que solicitó la auditoría",
      etiqueta: "Código de la entidad",
      icono: "pin",
      tipo: "text",
      placeholder: "Escriba aquí el código de la entidad",
      deshabilitado: false,
      validaciones: [
        { tipo: "requerido", valor: "" },
        { tipo: "maxLength", valor: 50 },
      ],
      claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "nombre_entidad",
      descripcion: "Nombre de la entidad que solicitó la auditoría",
      etiqueta: "Nombre de la entidad",
      icono: "account_balance",
      tipo: "text",
      placeholder: "Escriba aquí el nombre de la entidad",
      deshabilitado: false,
      validaciones: [
        { tipo: "requerido", valor: "" },
        { tipo: "maxLength", valor: 200 },
      ],
      claseGrid: "col-lg-8 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "nombre_auditoria",
      descripcion: "Nombre de la auditoría",
      etiqueta: "Nombre de la auditoría",
      icono: "assignment",
      tipo: "text",
      placeholder: "Escriba aquí el nombre de la auditoría",
      deshabilitado: false,
      validaciones: [
        { tipo: "requerido", valor: "" },
        { tipo: "maxLength", valor: 300 },
      ],
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
    },
    {
      nombre: "fecha_informe_final",
      descripcion: "Fecha de emisión del informe final",
      etiqueta: "Fecha de emisión del informe final",
      icono: "event",
      tipo: "date",
      deshabilitado: false,
      validaciones: [{ tipo: "requerido", valor: "" }],
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "vigencia",
      descripcion: "Vigencia de la auditoría",
      etiqueta: "Vigencia",
      icono: "today",
      tipo: "select",
      parametros: {
        urlParametros: `parametro?query=TipoParametroId:${environment.VIGENCIAS.TIPO_PARAMETRO_ID},Activo:true&fields=Id,Nombre&limit=0&sortby=nombre&order=desc`,
        opciones: [],
      },
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
  ],
};
