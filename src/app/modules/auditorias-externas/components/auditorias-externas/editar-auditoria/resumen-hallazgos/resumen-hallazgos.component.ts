import { Component, Input } from '@angular/core';
import { HallazgoResumen } from '../hallazgos-auditoria/hallazgos-auditoria.component';

@Component({
  selector: 'app-resumen-hallazgos',
  templateUrl: './resumen-hallazgos.component.html',
  styleUrls: ['./resumen-hallazgos.component.css']
})
export class ResumenHallazgosComponent {
  @Input() hallazgos: HallazgoResumen[] = [];

  displayedColumns: string[] = ['numero', 'criterio', 'descripcion'];
}
