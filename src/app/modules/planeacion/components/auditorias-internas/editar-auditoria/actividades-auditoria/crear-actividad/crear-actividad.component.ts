import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AlertService } from "src/app/shared/services/alert.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
@Component({
  selector: 'app-crear-actividad',
  templateUrl: './crear-actividad.component.html',
  styleUrl: './crear-actividad.component.css'
})
export class CrearActividadComponent {
  auditoriaId: string;
  datos: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
    private alertaService: AlertService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
  ) {
    this.auditoriaId = data.auditoriaId;
  }
  ngOnInit(): void {
    //console.log('Auditoría ID recibido:', this.auditoriaId);

  }
  crearActividad(actividadData: any) {
    console.log('Crear actividad:', actividadData);

    let actividadJson={
      auditoria_id:this.auditoriaId,
      titulo:actividadData.actividad,
      fecha_inicio:actividadData.fechaInicio.toISOString(),
      fecha_fin:actividadData.fechaFin.toISOString(),
    };
    console.log('Crear actividad json:', actividadJson);

    this.alertaService
      .showConfirmAlert("¿Está seguro(a) de crear la actividad?")
      .then((result) => {
        if (result.isConfirmed) {
          this.planAnualAuditoriaService
            .post(`actividad`, actividadJson)
            .subscribe(
              (response) => {
                if (response) {
                  this.alertaService.showSuccessAlert("Registro Creado");
                  this.datos.push(response);
                } else {
                  this.alertaService.showErrorAlert(
                    "Error al crear el registro"
                  );
                }
              },
              (error) => {
                console.log("error ",error)
                this.alertaService.showErrorAlert(
                  "Error al crear el registro"
                );
              }
            );
        }
      })
      .catch(() => {
        this.alertaService.showErrorAlert("Error al eliminar el registro");
      });
  }
}
