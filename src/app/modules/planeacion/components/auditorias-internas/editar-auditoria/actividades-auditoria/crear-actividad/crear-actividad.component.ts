import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AlertService } from "src/app/shared/services/alert.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { Actividad as ActividadPlan } from 'src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria';
import { Actividad } from 'src/app/shared/data/models/actividad';
@Component({
  selector: 'app-crear-actividad',
  templateUrl: './crear-actividad.component.html',
})
export class CrearActividadComponent {
  auditoriaId: string;
  datos: any | [] = [];
  minFechaStr: string | null = null;
  maxFechaStr: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      auditoriaId: string;
      minFechaStr?: string;
      maxFechaStr?: string;
    },
    private readonly alertaService: AlertService,
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService,
    private readonly dialogRef: MatDialogRef<CrearActividadComponent>
  ) {
    this.auditoriaId = data.auditoriaId;
    this.minFechaStr = data.minFechaStr ?? null;
    this.maxFechaStr = data.maxFechaStr ?? null;
  }

  ngOnInit(): void {}

  crearActividad(actividadData: ActividadPlan) {
    let actividadJson: Actividad = {
      auditoria_id: this.auditoriaId,
      titulo: actividadData.actividad,
      fecha_inicio: actividadData.fechaInicio.toISOString(),
      fecha_fin: actividadData.fechaFin.toISOString(),
      observacion: actividadData.observaciones,
      referencia: actividadData.papelTrabajoReferencia,
      descripcion: actividadData.papelTrabajoDescripcion,
      folio: actividadData.papelTrabajoFolios,
      medio: actividadData.papelTrabajoMedio,
      carpeta: actividadData.papelTrabajoCarpeta,
    };

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
                  this.dialogRef.close();
                } else {
                  this.alertaService.showErrorAlert(
                    "Error al crear el registro"
                  );
                }
              },
              (error) => {
                console.error("error al crear actividad:", error);
                this.alertaService.showErrorAlert(
                  "Error al crear el registro"
                );
              }
            );
        }
      })
      .catch((error) => {
        console.error("Error al crear actividad", error);
        this.alertaService.showErrorAlert("Error al crear el registro");
      });
  }
}
