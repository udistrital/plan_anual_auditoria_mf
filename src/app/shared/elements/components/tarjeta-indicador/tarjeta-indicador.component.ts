import { Component, Input } from "@angular/core";

export type VarianteTarjetaIndicador = "neutral" | "alerta" | "primaria" | "exito";

/**
 * Tarjeta de indicador (KPI) con título, valor numérico, subtítulo, ícono y nota inferior.
 * @example
 * <app-tarjeta-indicador titulo="Planes aprobados" [valor]="9" subtitulo="En ejecución"
 *   icono="verified" nota="Con visto bueno OCI" notaIcono="check_circle" variante="exito">
 * </app-tarjeta-indicador>
 */
@Component({
  selector: "app-tarjeta-indicador",
  templateUrl: "./tarjeta-indicador.component.html",
  styleUrls: ["./tarjeta-indicador.component.css"],
  standalone: false,
})
export class TarjetaIndicadorComponent {
  @Input() titulo: string = "";
  @Input() valor: number | string | null = 0;
  @Input() subtitulo: string = "";
  @Input() icono: string = "";
  @Input() nota: string = "";
  @Input() notaIcono: string = "";

  /**
   * Define los colores de la tarjeta.
   * @default "neutral"
   */
  @Input() variante: VarianteTarjetaIndicador = "neutral";
}
