import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { firstValueFrom } from 'rxjs';

interface HallazgoResumen {
  numero: string;
  criterio: string;
  descripcion: string;
}

@Component({
  selector: 'app-resumen-hallazgos',
  templateUrl: './resumen-hallazgos.component.html',
  styleUrls: ['./resumen-hallazgos.component.css']
})
export class ResumenHallazgosComponent implements OnInit, OnChanges {
  @Input() informeId!: string;

  displayedColumns: string[] = ['numero', 'criterio', 'descripcion'];
  hallazgos: HallazgoResumen[] = [];
  cargando = false;

  constructor(
    private planAnualAuditoriaService: PlanAnualAuditoriaService
  ) { }

  ngOnInit(): void {
    if (this.informeId) {
      this.cargarHallazgos();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['informeId'] && this.informeId) {
      this.cargarHallazgos();
    }
  }

  cargarHallazgos(): void {
    if (!this.informeId) return;

    this.cargando = true;

    // Queries en paralelo: estructura (temas+subtemas) y datos (hallazgos)
    Promise.all([
      firstValueFrom(this.planAnualAuditoriaService.get(`tema?query=informe_id:${this.informeId}`)),
      firstValueFrom(this.planAnualAuditoriaService.get(`hallazgo?query=informe_id:${this.informeId}`)),
    ]).then(([temasResp, hallazgosResp]: [any, any]) => {
      const temas: any[] = temasResp?.Data || [];
      const todosLosHallazgos: any[] = hallazgosResp?.Data || [];
      const hallazgosList: HallazgoResumen[] = [];

      let temaCount = 0;

      for (const tema of temas) {
        if (!tema.activo) continue;
        temaCount++;
        let subtemaCount = 0;

        for (const subtema of (tema.subtema || [])) {
          if (!subtema.activo) continue;
          subtemaCount++;
          let hallazgoCount = 0;

          const subtemaIdStr = subtema._id?.toString();
          const hallazgosDeSubtema = todosLosHallazgos.filter(
            (h: any) => h.subtema_id?.toString() === subtemaIdStr && h.activo !== false
          );

          for (const hallazgo of hallazgosDeSubtema) {
            hallazgoCount++;
            hallazgosList.push({
              numero: `${temaCount + 1}.${subtemaCount}.${hallazgoCount}`,
              criterio: hallazgo.criterio || '',
              descripcion: hallazgo.descripcion || ''
            });
          }
        }
      }

      this.hallazgos = hallazgosList;
      this.cargando = false;
    }).catch((error) => {
      console.error('Error al cargar hallazgos:', error);
      this.cargando = false;
    });
  }
}
