import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AlertService } from "src/app/shared/services/alert.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
@Component({
  selector: 'app-crear-actividad-seguimiento',
  templateUrl: './crear-actividad.component.html',
  styleUrl: './crear-actividad.component.css'
})
export class CrearActividadSeguimientoComponent {
  auditoriaId: string;
  datos: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CrearActividadSeguimientoComponent>,
    private alertaService: AlertService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
  ) {
    this.auditoriaId = data.auditoriaId;
  }

  ngOnInit(): void {
  }

  crearActividad(actividadData: any) {
    // ? The mock shows papelTrabajo fields, but where should the data be sent to?
    let actividadJson={
      auditoria_id:this.auditoriaId,
      titulo:actividadData.actividad,
      fecha_inicio:actividadData.fechaInicio.toISOString(),
      fecha_fin:actividadData.fechaFin.toISOString(),
      papeltrabajo_referencia:actividadData.papelTrabajoReferencia,
      papeltrabajo_descripcion:actividadData.papelTrabajoDescripcion,
      papeltrabajo_folios:actividadData.papelTrabajoFolios,
      papeltrabajo_medio:actividadData.papelTrabajoMedio,
      papeltrabajo_carpeta:actividadData.papelTrabajoCarpeta,
    };

    console.debug('Crear actividad json:', actividadJson);
    
    this.alertaService
      .showConfirmAlert("¿Está seguro(a) de crear la actividad?")
      .then((result) => {
        if (result.isConfirmed) {
          // TODO: Uncomment and update when papelTrabajo queries are resolved
          // this.planAnualAuditoriaService
          //   .post(`actividad`, actividadJson)
          //   .subscribe(
          //     (response) => {
          //       if (response) {
                  // TODO: Update UI accordingly
                  this.alertaService.showSuccessAlert("Mock Registro Creado");
          //         this.datos.push(response);
                  this.dialogRef.close(true);
          //       } else {
          //         this.alertaService.showErrorAlert(
          //           "Error al crear el registro"
          //         );
          //       }
          //     },
          //     (error) => {
          //       console.error("error al crear actividad:", error);
          //       this.alertaService.showErrorAlert(
          //         "Error al crear el registro"
          //       );
          //     }
          //   );
        }
      })
      .catch((error) => {
        console.error("Error al crear actividad", error);
        this.alertaService.showErrorAlert("Error al crear el registro");
      });
  }
}
