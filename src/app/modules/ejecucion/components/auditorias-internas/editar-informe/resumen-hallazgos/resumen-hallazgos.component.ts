import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';

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
export class ResumenHallazgosComponent implements OnChanges {
  @Input() informeId!: string;

  displayedColumns: string[] = ['numero', 'criterio', 'descripcion'];
  hallazgos: HallazgoResumen[] = [];
  cargando = false;

  constructor(
    private planAnualAuditoriaService: PlanAnualAuditoriaService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['informeId'] && this.informeId) {
      this.cargarHallazgos();
    }
  }

  cargarHallazgos(): void {
    if (!this.informeId) return;

    this.cargando = true;
    this.planAnualAuditoriaService.get(`informe/${this.informeId}/tema`).subscribe({
      next: (response: any) => {
        const temas = response?.Data || [];
        const hallazgosList: HallazgoResumen[] = [];

        temas.forEach((tema: any, i: number) => {
          const subtemas = tema.subtema || [];
          subtemas.forEach((subtema: any, j: number) => {
            const hallazgos = subtema.hallazgo || [];
            hallazgos.forEach((hallazgo: any, k: number) => {
              hallazgosList.push({
                numero: `${i + 2}.${j + 1}.${k + 1}`,
                criterio: hallazgo.criterio || '',
                descripcion: hallazgo.descripcion || ''
              });
            });
          });
        });

        this.hallazgos = hallazgosList;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar hallazgos:', error);
        this.cargando = false;
      }
    });
  }
}
