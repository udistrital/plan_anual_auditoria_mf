
import { Formulario } from "../models/formulario.model";

export const formularioPAA1: Formulario = {
    campos: [
        {
            nombre: "Objetivo",
            descripcion: "Objetivo del plan",
            etiqueta: "Objetivo",
            tipo: "textarea",
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
