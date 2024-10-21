
import { Formulario } from "../models/formulario.model";

export const formularioQuemado: Formulario = {
    campos: [
        {
            nombre: "no_auditoria",
            descripcion: "No Auditoria y/o seguimiento",
            etiqueta: "No Auditoria y/o seguimiento",
            tipo: "number",
            placeholder: "Escriba aquí su nombre",
            deshabilitado: false,
            validaciones: [
                { tipo: "requerido", valor: "" },
            ],
            claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12"
        },
        {
            nombre: "consecutivo_OCI",
            etiqueta: "Consecutivov OCI",
            tipo: "text",
            validaciones: [
                { tipo: "requerido", valor: "" },
                { tipo: "maxLength", valor: "30"}
            ],
            deshabilitado: false,
            claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12"
        },
        {
            nombre: "consecutivo_IE",
            etiqueta: "Consecutivov IE",
            tipo: "text",
            validaciones: [
                { tipo: "requerido", valor: "" },
                { tipo: "maxLength", valor: "30"}
            ],
            deshabilitado: false,
            claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12"
        },
        {
            nombre: "tipo",
            etiqueta: "Tipo",
            tipo: "select",
            parametros: {
                opciones: [
                    { valor: "1", etiqueta: "1" },
                    { valor: "2", etiqueta: "2" },
                    { valor: "3", etiqueta: "3" },
                    { valor: "4", etiqueta: "4" }
                ]
            },
            validaciones: [
                { tipo: "requerido", valor: "" }
            ],
            deshabilitado: false,
            claseGrid: "col-lg-2 col-md-6 col-sm-12 col-xs-12"
        },
        {
            nombre: "proceso",
            etiqueta: "Proceso",
            tipo: "select",
            parametros: {
                opciones: [
                    { valor: "Macroproceso", etiqueta: "Macroproceso" },
                    { valor: "Proceso", etiqueta: "Proceso" },
                    { valor: "Dependencia", etiqueta: "Dependencia" },
                ]
            },
            validaciones: [
                { tipo: "requerido", valor: "" }
            ],
            deshabilitado: false,
            claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12"
        },
        {
            nombre: "lider",
            etiqueta: "Lider",
            tipo: "text",
            validaciones: [
                { tipo: "requerido", valor: "" },
                { tipo: "maxLength", valor: "30"}
            ],
            deshabilitado: false,
            claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12"
        },
        {
            nombre: "responsable",
            etiqueta: "Responsable",
            tipo: "text",
            validaciones: [
                { tipo: "requerido", valor: "" },
                { tipo: "maxLength", valor: "30"}
            ],
            deshabilitado: false,
            claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12"
        },
        {
            nombre: "fecha_ejecucion_inicial",
            etiqueta: "Fecha de Ejecucion Inicial",
            parametros: {
                vista: "year",
                fecha_inicio: "2024-01-01T05:00:00.000Z"
            },
            validaciones: [
                { tipo: "requerido", valor: "" }
            ],
            deshabilitado: false,
            tipo: "date",
            claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12"
        },
        {
            nombre: "fecha_ejecucion_final",
            etiqueta: "Fecha de Ejecucion Final",
            parametros: {
                vista: "year",
                fecha_inicio: "2024-01-01T05:00:00.000Z"
            },
            validaciones: [
                { tipo: "requerido", valor: "" }
            ],
            deshabilitado: false,
            tipo: "date",
            claseGrid: "col-lg-4 col-md-6 col-sm-12 col-xs-12"
        },
        {
            nombre: "objetivo_auditoria",
            etiqueta: "Objetivo de la Auditoría",
            tipo: "text",
            validaciones: [
                { tipo: "requerido", valor: "" },
                { tipo: "maxLength", valor: "30"}
            ],
            deshabilitado: false,
            claseGrid: "col-lg-12 col-md-6 col-sm-12 col-xs-12"
        },
        {
            nombre: "alcance_auditoria",
            etiqueta: "Alcance de la Auditoría",
            tipo: "text",
            validaciones: [
                { tipo: "requerido", valor: "" },
                { tipo: "maxLength", valor: "30"}
            ],
            deshabilitado: false,
            claseGrid: "col-lg-12 col-md-6 col-sm-12 col-xs-12"
        },
        {
            nombre: "criterios",
            etiqueta: "Criterios",
            tipo: "text",
            validaciones: [
                { tipo: "requerido", valor: "" },
                { tipo: "maxLength", valor: "30"}
            ],
            deshabilitado: false,
            claseGrid: "col-lg-12 col-md-6 col-sm-12 col-xs-12"
        }
    ]
}
