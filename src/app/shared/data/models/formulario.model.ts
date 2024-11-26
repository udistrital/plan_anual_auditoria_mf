export class Formulario {
  campos?: Campo[];
}

export class Campo {
  nombre: string = "";
  descripcion?: string;
  etiqueta: any;
  etiqueta_inicio?: string;
  etiqueta_fin?: string;
  tipo:
    | "text"
    | "email"
    | "number"
    | "select"
    | "radiobutton"
    | "checkbox"
    | "date"
    | "date-range"
    | "icono"
    | "textarea" = "text";
  placeholder?: string;
  validaciones?: any;
  icono?: string;
  parametros?: {
    urlParametros?: string;
    opciones?: Array<{
      Nombre: string;
      Id?: string;
      deshabilitado?: boolean;
    }>;
    vista?: "month" | "year" | "multi-year";
    fecha_inicio?: string;
    etiqueta_inicio?: string;
    etiqueta_fin?: string;
  };
  deshabilitado?: boolean;
  valor?: any;
  claseGrid?: string;
}
