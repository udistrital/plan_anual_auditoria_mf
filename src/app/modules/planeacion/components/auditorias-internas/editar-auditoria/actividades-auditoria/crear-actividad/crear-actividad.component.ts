import { Component } from '@angular/core';

@Component({
  selector: 'app-crear-actividad',
  templateUrl: './crear-actividad.component.html',
  styleUrl: './crear-actividad.component.css'
})
export class CrearActividadComponent {
  onCreate(activityData: any) {
    console.log('Crear actividad:', activityData);
    // Aquí puedes agregar la lógica para guardar la actividad.
  }
}
