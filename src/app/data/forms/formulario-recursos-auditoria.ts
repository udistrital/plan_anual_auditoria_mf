
import { Formulario } from "../models/formulario.model";

export const formularioRecursosAuditoria: Formulario = {
    campos: [
        {
            nombre: "tecnologicos",
            etiqueta: "Tecnológicos",
            tipo: "textarea",
            validaciones: [
                { tipo: "requerido", valor: "" },
                { tipo: "maxLength", valor: "8"}
            ],
            deshabilitado: false,
            claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12"
        },
        {
            nombre: "humanos",
            etiqueta: "Humanos",
            tipo: "textarea",
            validaciones: [
                { tipo: "requerido", valor: "" },
                { tipo: "maxLength", valor: "8"}
            ],
            deshabilitado: false,
            claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12"
        },
        {
            nombre: "Fisicos",
            etiqueta: "Fisicos",
            tipo: "textarea",
            validaciones: [
                { tipo: "requerido", valor: "" },
                { tipo: "maxLength", valor: "8"}
            ],
            deshabilitado: false,
            claseGrid: "col-lg-12 col-md-12 col-sm-12 col-xs-12"
        }
    ]
}
