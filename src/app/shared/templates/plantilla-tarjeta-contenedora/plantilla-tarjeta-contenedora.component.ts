import { Component, Input, TemplateRef } from "@angular/core";
import { SafeHtml } from "@angular/platform-browser";

@Component({
  selector: "plantilla-tarjeta-contenedora",
  templateUrl: "./plantilla-tarjeta-contenedora.component.html",
  styleUrl: "./plantilla-tarjeta-contenedora.component.css",
})
export class PlantillaTarjetaContenedoraComponent {
  @Input() breadcrumb!: SafeHtml;
  @Input() title: string = "";
  @Input() contenido!: TemplateRef<any>;
}
