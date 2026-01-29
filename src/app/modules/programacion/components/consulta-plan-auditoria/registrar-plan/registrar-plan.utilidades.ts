import { Formulario } from "src/app/shared/data/models/formulario.model";

export const formularioPAA: Formulario = {
  campos: [
    {
      nombre: "objetivo",
      descripcion: "Objetivo del plan",
      etiqueta: "Objetivo",
      tipo: "textarea",
      icono: "flag",
      valor:
        "Planear las actividades que realizará el equipo auditor de la Oficina de Control Interno, mediante la aplicación de auditorías y seguimientos que contribuyan a proteger los recursos, garantizar los estándares de las operaciones, la confiabilidad y oportunidad de la información, dar manejo adecuado a los riesgos para contribuir con el cumplimiento de los objetivos institucionales y la mejora de la gestión de la Universidad.",
      placeholder: "Escriba aquí el Objetivo",
      deshabilitado: false,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
      validaciones: [
        {
          tipo: "requerido",
          valor: "",
        },
      ],
    },
    {
      nombre: "alcance",
      descripcion: "Alcance del plan",
      etiqueta: "Alcance",
      tipo: "textarea",
      icono: "track_changes",
      valor:
        "Planear las actividades que realizará el equipo auditor de la Oficina de Control Interno, mediante la aplicación de auditorías y seguimientos que contribuyan a proteger los recursos, garantizar los estándares de las operaciones, la confiabilidad y oportunidad de la información, dar manejo adecuado a los riesgos para contribuir con el cumplimiento de los objetivos institucionales y la mejora de la gestión de la Universidad.",
      placeholder: "Escriba aquí el Alcance",
      deshabilitado: false,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
      validaciones: [
        {
          tipo: "requerido",
          valor: "",
        },
      ],
    },
    {
      nombre: "criterio",
      descripcion: "Criterios del plan",
      etiqueta: "Criterios",
      tipo: "textarea",
      icono: "check_circle",
      valor:
        "Normatividad interna y externa aplicable a la Universidad.\nDireccionamiento Estratégico\nModelo Integrado de Planeación y Gestión MIPG\nSistema Integrado de Gestión\nProyectos de Inversión",
      placeholder: "Escriba aquí el Criterios",
      deshabilitado: false,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
      validaciones: [
        {
          tipo: "requerido",
          valor: "",
        },
      ],
    },
    {
      nombre: "recurso",
      descripcion: "Recursos del plan",
      etiqueta: "Recursos",
      tipo: "textarea",
      icono: "inventory",
      valor:
        "Humanos: Equipo de trabajo de la Oficina de Control interno (servidores públicos y/o particulares que ejerzan funciones públicas permanente o transitoria)\nFinancieros: Presupuesto asignado\nTecnológicos: Equipos de cómputo, sistemas de información, archivo documental, papelería, sistemas de redes y correo electrónico de la Universidad.",
      placeholder: "Escriba aquí los Recursos",
      deshabilitado: false,
      claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
      validaciones: [
        {
          tipo: "requerido",
          valor: "",
        },
      ],
    },
  ],
};
