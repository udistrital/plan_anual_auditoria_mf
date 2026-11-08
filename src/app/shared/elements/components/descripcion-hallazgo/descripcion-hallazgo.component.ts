import { Component, Input, OnChanges, signal } from '@angular/core';
import { NuxeoService } from 'src/app/core/services/nuxeo.service';
import { descripcionAHtml, esHtmlVacio } from 'src/app/shared/utils/html.util';

type EstadoDescripcion = 'cargando' | 'lista' | 'vacia' | 'error';

/** Muestra completa una descripción de hallazgo: texto plano, HTML o enlace de Nuxeo (con imágenes). */
@Component({
  selector: 'app-descripcion-hallazgo',
  templateUrl: './descripcion-hallazgo.component.html',
  styleUrls: ['./descripcion-hallazgo.component.css'],
  standalone: false,
})
export class DescripcionHallazgoComponent implements OnChanges {
  @Input() valor: string | null | undefined = '';

  readonly estado = signal<EstadoDescripcion>('cargando');
  readonly html = signal('');
  // Si `valor` cambia durante una descarga, se descarta la respuesta anterior
  private consulta = 0;

  constructor(private readonly nuxeoService: NuxeoService) {}

  async ngOnChanges(): Promise<void> {
    const consulta = ++this.consulta;
    this.estado.set('cargando');
    try {
      const html = await descripcionAHtml(this.valor, (uuid) => this.nuxeoService.obtenerPorUUID(uuid));
      if (consulta !== this.consulta) return;
      this.html.set(html);
      this.estado.set(esHtmlVacio(html) ? 'vacia' : 'lista');
    } catch (error) {
      if (consulta !== this.consulta) return;
      console.error('No se pudo cargar la descripción del hallazgo:', error);
      this.estado.set('error');
    }
  }
}
