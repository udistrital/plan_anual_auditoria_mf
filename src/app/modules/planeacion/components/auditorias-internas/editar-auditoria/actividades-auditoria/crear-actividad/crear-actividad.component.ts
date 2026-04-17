import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AlertService } from "src/app/shared/services/alert.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { Actividad as ActividadPlan } from 'src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria';
import { Actividad } from 'src/app/shared/data/models/actividad';
@Component({
  selector: 'app-crear-actividad',
  templateUrl: './crear-actividad.component.html',
  styleUrl: './crear-actividad.component.css'
})
export class CrearActividadComponent {
  auditoriaId: string;
  minFecha: Date | null = null;
  maxFecha: Date | null = null;
  datos: any | [] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      auditoriaId: string;
      minFechaStr?: string;
      maxFechaStr?: string;
    },
    private alertaService: AlertService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    private dialogRef: MatDialogRef<CrearActividadComponent>
  ) {
    this.auditoriaId = data.auditoriaId;
    this.minFecha = data.minFechaStr ? new Date(data.minFechaStr.toString().substring(0, 10) + "T00:00:00") : null;
    this.maxFecha = data.maxFechaStr ? new Date(data.maxFechaStr.toString().substring(0, 10) + "T00:00:00") : null;
  }

  ngOnInit(): void {
  }

  crearActividad(actividadData: ActividadPlan) {
    const fechaInicioValida = this.minFecha ? actividadData.fechaInicio >= this.minFecha : true;
    const fechaFinValida = this.maxFecha ? actividadData.fechaFin <= this.maxFecha : true;
    if (!fechaInicioValida || !fechaFinValida) {
      const mensajeError = `Las fechas deben estar entre ${this.minFecha?.toLocaleDateString()} y ${this.maxFecha?.toLocaleDateString()}`;
      this.alertaService.showErrorAlert(mensajeError);
      return;
    }

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
