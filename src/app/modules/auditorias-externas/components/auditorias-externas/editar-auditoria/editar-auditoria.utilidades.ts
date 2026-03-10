import { Formulario } from "src/app/shared/data/models/formulario.model";

// iconos
// format_list_numbered
// check_circle
// visibility

export const formularioInformacionAuditoria: Formulario = {
  campos: [
    {
      nombre: "titulo_aduitoria",
      descripcion: "Titulo de Auditoría",
      etiqueta: "Titulo de Auditoría",
      icono: "assignment",
      tipo: "text",
      placeholder: "Escriba aquí el titulo de la auditoría",
      deshabilitado: false,
      validaciones: [{ tipo: "requerido", valor: "" }],
      claseGrid: "col-lg-7 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "origen_auditoria",
      etiqueta: "Origen Auditoría",
      icono: "flag",
      tipo: "select",
      parametros: {
        opciones: [
          { Id: "1", Nombre: "Externa" },
          { Id: "2", Nombre: "Contraloría de Bogotá" },
          { Id: "3", Nombre: "Otros" },
        ],
      },
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-5 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "tipo",
      etiqueta: "Tipo",
      icono: "list",
      tipo: "select",
      parametros: {
        urlParametros:
          "parametro?query=TipoParametroId:140&fields=Id,Nombre&limit=0",
      },
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-3 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "proceso",
      etiqueta: "Proceso",
      icono: "work",
      tipo: "select",
      parametros: {
        opciones: [
          { Id: "1", Nombre: "Macroproceso" },
          { Id: "2", Nombre: "Proceso" },
          { Id: "3", Nombre: "Dependencia" },
        ],
      },
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-3 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "auditor_responsable",
      etiqueta: "Auditor Responsable",
      icono: "person",
      tipo: "text",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "lider",
      etiqueta: "Líder",
      icono: "person",
      tipo: "text",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "responsable",
      etiqueta: "Responsable",
      icono: "supervisor_account",
      tipo: "text",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    }
  ],
};
