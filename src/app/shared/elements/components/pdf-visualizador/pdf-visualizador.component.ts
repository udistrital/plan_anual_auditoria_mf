import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  HostListener,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { saveAs } from "file-saver";

@Component({
    selector: "app-pdf-visualizador",
    templateUrl: "./pdf-visualizador.component.html",
    styleUrls: ["./pdf-visualizador.component.css"],
    standalone: false
})
export class PdfVisualizadorComponent implements OnChanges {
  @ViewChild("pdfCanvas", { static: true })
  pdfCanvas!: ElementRef<HTMLCanvasElement>;

  @ViewChild("contenedorVisor")
  contenedorVisor?: ElementRef<HTMLElement>;

  static readonly ZOOM_MINIMO = 0.5;
  static readonly ZOOM_MAXIMO = 2;
  static readonly PASO_ZOOM = 0.25;

  pdfLoaded = false;
  pdfSrc: Uint8Array | undefined;
  zoom = 1;
  enPantallaCompleta = false;

  @Input() base64Document: string = "";

  /**
   * Muestra la barra con alejar/acercar, descarga del PDF que se está viendo y pantalla completa.
   * @default false
   */
  @Input() herramientas: boolean = false;

  /** Nombre (sin extensión) con el que se descarga el PDF desde la barra de herramientas. */
  @Input() nombreArchivo: string = "documento";

  // Este método se ejecuta cada vez que el valor de base64Document cambia.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['base64Document'] && this.base64Document) {
      this.zoom = 1;
      this.cargarPdfDeBase64(this.base64Document);  // Cargar el nuevo PDF
    }
  }

  cargarPdfDeBase64(base64: string) {
    try {
      const arrayBuffer = this.base64ToArrayBuffer(base64);
      this.pdfSrc = new Uint8Array(arrayBuffer);
      this.pdfLoaded = true;
    } catch (error) {
      console.error("Error loading PDF:", error);
    }
  }

  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64); // Decodifica Base64
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer; // Retorna el ArrayBuffer
  }

  get porcentajeZoom(): number {
    return Math.round(this.zoom * 100);
  }

  get puedeAlejar(): boolean {
    return this.zoom > PdfVisualizadorComponent.ZOOM_MINIMO;
  }

  get puedeAcercar(): boolean {
    return this.zoom < PdfVisualizadorComponent.ZOOM_MAXIMO;
  }

  alejar(): void {
    if (this.puedeAlejar) {
      this.zoom = Math.max(PdfVisualizadorComponent.ZOOM_MINIMO, this.zoom - PdfVisualizadorComponent.PASO_ZOOM);
    }
  }

  acercar(): void {
    if (this.puedeAcercar) {
      this.zoom = Math.min(PdfVisualizadorComponent.ZOOM_MAXIMO, this.zoom + PdfVisualizadorComponent.PASO_ZOOM);
    }
  }

  /**
   * Descarga el documento que se está visualizando.
   * Se reconstruye desde el base64: ng2-pdf-viewer transfiere `pdfSrc` al worker de pdf.js,
   * que deja ese buffer vacío (detached), así que no sirve para generar el archivo.
   */
  descargar(): void {
    if (!this.base64Document) {
      return;
    }
    try {
      const bytes = new Uint8Array(this.base64ToArrayBuffer(this.base64Document));
      const nombre = (this.nombreArchivo || "documento").trim();
      saveAs(new Blob([bytes], { type: "application/pdf" }), `${nombre}.pdf`);
    } catch (error) {
      console.error("Error al descargar el PDF:", error);
    }
  }

  alternarPantallaCompleta(): void {
    const elemento = this.contenedorVisor?.nativeElement;
    if (!elemento) {
      return;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      elemento.requestFullscreen?.();
    }
  }

  // Sincroniza el ícono si el usuario sale de pantalla completa con Esc
  @HostListener("document:fullscreenchange")
  alCambiarPantallaCompleta(): void {
    this.enPantallaCompleta = !!document.fullscreenElement
      && document.fullscreenElement === this.contenedorVisor?.nativeElement;
  }
}
