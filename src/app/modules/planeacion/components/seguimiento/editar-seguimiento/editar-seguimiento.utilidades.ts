import { Formulario } from "src/app/shared/data/models/formulario.model";
import { environment } from "src/environments/environment";

export const formularioInformacionAuditoria: Formulario = {
  campos: [
    {
      nombre: "no_auditoria",
      descripcion: "No Auditoria y/o seguimiento",
      etiqueta: "No Auditoria y/o seguimiento",
      icono: "format_list_numbered",
      tipo: "number",
      placeholder: "Escriba aquí el número de la auditoria",
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
      nombre: "tipo",
      etiqueta: "Tipo",
      icono: "list",
      tipo: "select",
      parametros: {
        urlParametros: `parametro?query=TipoParametroId:${environment.INFO_AUDITORIA.TIPOS_PROCESO.ID}&fields=Id,Nombre&limit=0`,
      },
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-2 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "proceso",
      etiqueta: "Proceso",
      icono: "work",
      tipo: "select",
      parametros: {
        //vacio porque se llena en el componente editar auditoria
      },
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-5 col-md-6 col-sm-12 col-xs-12",
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
      claseGrid: "col-lg-5 col-md-6 col-sm-12 col-xs-12",
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
  ],
};
