import { Pipe, PipeTransform } from "@angular/core";
import { descripcionATexto } from "src/app/shared/utils/html.util";

/** Muestra en texto una descripción (texto plano, HTML o enlace de Nuxeo) sin consultar el gestor documental. */
@Pipe({
  name: "descripcionTexto",
  standalone: true,
})
export class DescripcionTextoPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return descripcionATexto(valor);
  }
}
