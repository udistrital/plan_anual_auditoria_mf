import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

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
    const lista: HallazgoResumen[] = [];
    let temaCount = 0;

    for (const tema of temas) {
      if (!tema.activo) continue;
      temaCount++;
      let subtemaCount = 0;

      for (const subtema of (tema.subtema ?? [])) {
        if (!subtema.activo) continue;
        subtemaCount++;
        let hallazgoCount = 0;

        const subtemaIdStr = subtema._id?.toString();
        for (const h of hallazgos.filter(h => h.subtema_id?.toString() === subtemaIdStr && h.activo !== false)) {
          hallazgoCount++;
          lista.push({
            numero: `${temaCount + 1}.${subtemaCount}.${hallazgoCount}`,
            criterio: h.criterio ?? '',
            descripcion: h.descripcion ?? ''
          });
        }
      }
    }

    this.hallazgos = lista;
  }
}
