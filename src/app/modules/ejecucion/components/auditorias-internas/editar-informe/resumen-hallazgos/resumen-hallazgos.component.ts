import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { numerarHallazgos } from 'src/app/shared/utils/numeracion-hallazgos.util';

interface HallazgoResumen {
  numero: string;
  criterio: string;
  descripcion: string;
}

@Component({
    selector: 'app-resumen-hallazgos',
    templateUrl: './resumen-hallazgos.component.html',
    styleUrls: ['./resumen-hallazgos.component.css'],
    standalone: false
})
export class ResumenHallazgosComponent implements OnChanges {
  @Input() informeId!: string;
  @Input() temasRaw: any[] | null = null;
  @Input() hallazgosRaw: any[] | null = null;

  displayedColumns: string[] = ['numero', 'criterio', 'descripcion'];
  hallazgos: HallazgoResumen[] = [];
  cargando = false;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['temasRaw'] || changes['hallazgosRaw']) && this.temasRaw !== null && this.hallazgosRaw !== null) {
      this.computarHallazgos(this.temasRaw, this.hallazgosRaw);
    }
  }

  private computarHallazgos(temas: any[], hallazgos: any[]): void {
    this.hallazgos = numerarHallazgos(temas, hallazgos).map((n) => ({
      numero: n.numero,
      criterio: n.hallazgo.criterio ?? '',
      descripcion: n.hallazgo.descripcion ?? '',
    }));
  }
}
