import { Component, Input} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import  { ActividadFormularioComponent } from '../actividad-formulario/actividad-formulario.component'
@Component({
  selector: 'app-editar-actividad',
  templateUrl: './editar-actividad.component.html',
  styleUrl: './editar-actividad.component.css'
})
export class EditarActividadComponent {
   @Input() actividadData: any = {}; 
  /*actividad = {
    nombreActividad: 'Actividad Ejemplo',
    fechaInicio: new Date('2025-01-01'),
    fechaFin: new Date('2025-01-15'),
  };*/
  constructor(private dialog: MatDialog) {}

  onEdit(actividadData: any) {
    console.log('Editar actividad:', actividadData);
    const dialogRef = this.dialog.open(ActividadFormularioComponent, {
      width: '1100px', 
      data: this.actividadData, 
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Actividad actualizada:', result);
        // Actualiza la tabla o realiza otra acción necesaria
      }
    });
  }
}
