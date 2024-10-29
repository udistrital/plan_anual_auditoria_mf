
import { Formulario } from "../models/formulario.model";

export const formularioPAA2: Formulario = {
    campos: [
        {
            nombre: "Objetivo",
            descripcion: "Objetivo del plan",
            etiqueta: "Objetivo",
            tipo: "textarea",
            valor: "Establecer un plan anual de auditorías para asegurar la calidad del sistema de gestión.",
            placeholder: "Escriba aquí el Objetivo",
            deshabilitado: false,
            claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
            validaciones: [
                {
                    tipo: "requerido",
                    valor: ""
                }
            ]
        },
        {
            nombre: "Alcance",
            descripcion: "Alcance del plan",
            etiqueta: "Alcance",
            tipo: "textarea",
            valor: "Todas las áreas de la organización serán auditadas en el transcurso del año.",
            placeholder: "Escriba aquí el Alcance",
            deshabilitado: false,
            claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
            validaciones: [
                {
                    tipo: "requerido",
                    valor: ""
                }
            ]
        },
        {
            nombre: "Criterios",
            descripcion: "Criterios del plan",
            etiqueta: "Criterios",
            tipo: "textarea",
            valor: "Se seguirán los criterios establecidos en la norma ISO 9001:2015.",
            placeholder: "Escriba aquí el Criterios",
            deshabilitado: false,
            claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
            validaciones: [
                {
                    tipo: "requerido",
                    valor: ""
                }
            ]
        },
        {
            nombre: "Recursos",
            descripcion: "Recursos del plan",
            etiqueta: "Recursos",
            tipo: "textarea",
            valor: "El equipo de auditores internos, consultores externos, y herramientas tecnológicas.",
            placeholder: "Escriba aquí los Recursos",
            deshabilitado: false,
            claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
            validaciones: [
                {
                    tipo: "requerido",
                    valor: ""
                }
            ]
        }
    ]
}
