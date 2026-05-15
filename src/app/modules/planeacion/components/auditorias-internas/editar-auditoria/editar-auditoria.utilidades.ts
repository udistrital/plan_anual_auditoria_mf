import { Formulario } from "src/app/shared/data/models/formulario.model";

export const formularioInformacionAuditoria: Formulario = {
  campos: [
    {
      nombre: "consecutivo_no_auditoria",
      descripcion: "No Auditoría y/o seguimiento",
      etiqueta: "No Auditoría y/o seguimiento",
      icono: "format_list_numbered",
      tipo: "number",
      placeholder: "Escriba aquí el número de la auditoría",
      deshabilitado: false,
      validaciones: [{ tipo: "requerido", valor: "" }],
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "consecutivo_OCI",
      etiqueta: "Consecutivo OCI",
      icono: "bookmark",
      tipo: "text",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
    /*{
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
    },*/
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
      nombre: "fecha_ejecucion_inicial",
      etiqueta: "Fecha de Ejecución Inicial",
      icono: "event",
      tooltip: "Inicio del periodo en el cual se planea realizar la evaluación.",
      parametros: {
        vista: "year",
        fecha_inicio: "2026-01-01T05:00:00.000Z",
      },
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      tipo: "date",
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "fecha_ejecucion_final",
      etiqueta: "Fecha de Ejecución Final",
      icono: "event_available",
      tooltip: "Fin del periodo en el cual se planea realizar la evaluación.",
      parametros: {
        vista: "year",
        fecha_inicio: "2026-01-01T05:00:00.000Z",
      },
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      tipo: "date",
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "objetivo_auditoria",
      etiqueta: "Objetivo de la Auditoría",
      icono: "flag",
      tipo: "quill",
      tooltip: "Son los propósitos establecidos, lo que se busca lograr con la auditoría, será relevante tener en cuenta las diferentes categorías de objetivos de la Entidad (estratégicos, de cumplimiento, operativos) y que serán de interés para la auditoría, en última instancia, el éxito del proceso dependerá de la claridad con que se establezcan los objetivos y que el equipo auditor conozca y entienda los objetivos de la Entidad, ya que su óptima alineación se verá reflejada en los resultados finales y el aporte de dicho procesos a la mejora de la Entidad.",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
      placeholder: "Escriba aquí el objetivo de la auditoría",
      quillConfig: {
        toolbar: [
          ["bold", "italic"],
          [{ list: "ordered" }, { list: "bullet" }]
        ],
      }
    },
    {
      nombre: "alcance_auditoria",
      etiqueta: "Alcance de la Auditoría",
      icono: "visibility",
      tipo: "quill",
      tooltip: "Establece el marco o límite de la auditoría y los temas o actividades que son objeto de la misma. Se define en función del objetivo de auditoría, del riesgo de auditoría, de la naturaleza y características del proceso. El alcance establecido debe ser suficiente para satisfacer los objetivos del trabajo. Igualmente se deben incluir las limitaciones al alcance de la auditoría, que son los factores externos al equipo de auditoría que hayan impedido al auditor obtener toda la información y explicaciones que considere necesarias para cumplir con los objetivos del trabajo.",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
      placeholder: "Escriba aquí el alcance de la auditoría",
      quillConfig: {
        toolbar: [
          ["bold", "italic"],
          [{ list: "ordered" }, { list: "bullet" }]
        ],
      }
    },
    {
      nombre: "criterios",
      etiqueta: "Criterios",
      icono: "check_circle",
      tipo: "quill",
      tooltip: "Normatividad interna y/o externa que aplica al proceso a auditar.",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
      placeholder: "Escriba aquí los criterios de la auditoría",
      quillConfig: {
        toolbar: [
          ["bold", "italic"],
          [{ list: "ordered" }, { list: "bullet" }]
        ],
      }
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
      nombre: "tema",
      etiqueta: "Solicitud de información",
      tipo: "quill",
      validaciones: [{ tipo: "requerido", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
      placeholder: "Escriba aquí los temas a tratar en la auditoría",
      quillConfig: {
        toolbar: [
          ["bold", "italic"],
          [{ list: "ordered" }, { list: "bullet" }]
        ],
      },
    }
  ]
}

export const formularioDependencias: Formulario = {
  campos: [
    {
      nombre: "dependencia_id",
      etiqueta: "Dependencia",
      tipo: "text",
      deshabilitado: false,
      claseGrid: "d-none",
    },
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
    {
      nombre: "jefe_correo",
      etiqueta: "Correo Jefe dependencia",
      icono: "email",
      tipo: "email",
      deshabilitado: true,
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "asistente_correo",
      etiqueta: "Correo Asistente dependencia",
      icono: "email",
      tipo: "email",
      deshabilitado: true,
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "correo_dependencia",
      etiqueta: "Correo Dependencia",
      icono: "email",
      tipo: "email",
      deshabilitado: true,
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
    {
      nombre: "correo_complementario",
      etiqueta: "Correo Complementario",
      icono: "email",
      tipo: "email",
      validaciones: [{ tipo: "email", valor: "" }],
      deshabilitado: false,
      claseGrid: "col-lg-6 col-md-6 col-sm-12 col-xs-12",
    },
  ]
}
