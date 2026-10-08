import { Component, Input } from "@angular/core";

export interface PasoFlujo {
  titulo: string;
  descripcion: string;
}

/**
 * Tarjeta informativa con un flujo de pasos numerados.
 * @example
 * <app-flujo-pasos titulo="Flujo del proceso" descripcion="..." [pasos]="pasos"></app-flujo-pasos>
 */
@Component({
  selector: "app-flujo-pasos",
  templateUrl: "./flujo-pasos.component.html",
  styleUrls: ["./flujo-pasos.component.css"],
  standalone: false,
})
export class FlujoPasosComponent {
  @Input() titulo: string = "";
  @Input() descripcion: string = "";
  @Input() icono: string = "account_tree";
  @Input() pasos: PasoFlujo[] = [];
}
