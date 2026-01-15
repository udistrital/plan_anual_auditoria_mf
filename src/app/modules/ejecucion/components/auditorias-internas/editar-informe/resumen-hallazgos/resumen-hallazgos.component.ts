import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-resumen-hallazgos',
  templateUrl: './resumen-hallazgos.component.html',
  styleUrls: ['./resumen-hallazgos.component.css']
})
export class ResumenHallazgosComponent {
  displayedColumns: string[] = ['numero', 'criterio', 'descripcion'];

  @Input() findings: any[] = [
    {
      numero: '1',
      criterio: 'Cumplimiento del requisito A',
      descripcion: 'Falta de documentación en el proceso.',
    },
    {
      numero: '2',
      criterio: 'Cumplimiento del requisito B',
      descripcion: 'El criterio no se aplica correctamente.',
    },
  ];

}
