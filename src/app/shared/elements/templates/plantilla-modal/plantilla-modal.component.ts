import { Component, HostBinding, Input, TemplateRef } from "@angular/core";

@Component({
    selector: "plantilla-modal",
    templateUrl: "./plantilla-modal.component.html",
    styleUrl: "./plantilla-modal.component.css",
    standalone: false
})
export class PlantillaModalComponent {
  @Input() icono: string = "";
  @Input() titulo: string = "";
  @Input() descripcion: string = "";
  @Input() contenido!: TemplateRef<any>;
  @Input() footer!: TemplateRef<any>;
  @Input() alignFooter: "center" | "start" | "end" | undefined = "center";

  /**
   * Activa la línea gráfica homologada del modal (`.sisifo-ui`, ver `assets/styles/_sisifo-ui.scss`):
   * encabezado con título primario, descripción y separador, y botones rectos.
   * @default false
   */
  @HostBinding("class.sisifo-ui")
  @Input() homologado: boolean = false;
}
