import { Pipe, PipeTransform } from "@angular/core";

/**
 * Devuelve la clase del chip de estado de la línea gráfica homologada (`_sisifo-ui.scss`)
 * a partir del nombre del estado:
 * - revisión u observaciones → amarillo (`estado-revision`)
 * - rechazado o devuelto → rojo (`estado-rechazado`)
 * - aprobado o finalizado → verde (`estado-aprobado`)
 * - borrador y demás estados en curso → gris (`estado-borrador`)
 *
 * @example
 * <span class="estado-chip" [ngClass]="'En Revisión Jefe' | claseEstado">En Revisión Jefe</span>
 */
@Pipe({
  name: "claseEstado",
  standalone: true,
})
export class ClaseEstadoPipe implements PipeTransform {
  transform(estado: string | null | undefined): string {
    const texto = (estado ?? "").toLowerCase();
    if (/rechaz|devuelt/.test(texto)) {
      return "estado-rechazado";
    }
    if (/revisi|observaci/.test(texto)) {
      return "estado-revision";
    }
    if (/aprob|finaliz/.test(texto)) {
      return "estado-aprobado";
    }
    return "estado-borrador";
  }
}
