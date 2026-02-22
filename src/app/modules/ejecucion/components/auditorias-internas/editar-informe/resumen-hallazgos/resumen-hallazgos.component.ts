import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
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
    this.planAnualAuditoriaService.get(`tema?query=informe_id:${this.informeId}`).subscribe({
      next: (response: any) => {
        const temas = response?.Data || [];
        const hallazgosList: HallazgoResumen[] = [];

        let temaCount = 0;

        temas.forEach((tema: any) => {
          //Solo temas activos
          if (!tema.activo) return;

          temaCount++;
          let subtemaCount = 0;

          const subtemas = tema.subtema || [];
          subtemas.forEach((subtema: any) => {
            //Solo subtemas activos
            if (!subtema.activo) return;

            subtemaCount++;
            let hallazgoCount = 0;

            const hallazgos = subtema.hallazgo || [];
            hallazgos.forEach((hallazgo: any) => {
              //Solo hallazgos activos
              if (!hallazgo.activo) return;

              hallazgoCount++;
              hallazgosList.push({
                numero: `${temaCount + 1}.${subtemaCount}.${hallazgoCount}`,
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