import { Component, Input } from '@angular/core';
import { HallazgoExterno } from 'src/app/shared/data/models/registro-auditoria-externa';

@Component({
  selector: 'app-resumen-hallazgos',
  templateUrl: './resumen-hallazgos.component.html',
  styleUrls: ['./resumen-hallazgos.component.css'],
  standalone: false,
})
export class ResumenHallazgosComponent {
  @Input() hallazgos: HallazgoExterno[] = [];

  displayedColumns: string[] = ['numeral', 'vigencia', 'codigo', 'descripcion', 'dependencias'];
}
