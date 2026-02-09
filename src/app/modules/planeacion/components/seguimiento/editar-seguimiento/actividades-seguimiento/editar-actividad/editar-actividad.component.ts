import { Component, Input, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AlertService } from "src/app/shared/services/alert.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";


@Component({
  selector: 'app-editar-actividad-seguimiento',
  templateUrl: './editar-actividad.component.html',
  styleUrl: './editar-actividad.component.css'
})
export class EditarActividadSeguimientoComponent {
  datos: any;
  actividadData: any;
  idAuditoria: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<EditarActividadSeguimientoComponent>,
    private alertaService: AlertService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,

  ) {
    this.actividadData = data.actividad;
    this.idAuditoria = data.idAuditoria;
   }

  ngOnInit(): void {
  }

  editarActividad(actividadData: any) {
    let actividadJson={
      auditoria_id:this.idAuditoria,
      titulo:actividadData.actividad,
      fecha_inicio:actividadData.fechaInicio.toISOString(),
      fecha_fin:actividadData.fechaFin.toISOString(),
      // TODO: update papelTrabajo fields when business logic is clear
      // papeltrabajo_referencia:actividadData.papelTrabajoReferencia,
      // papeltrabajo_descripcion:actividadData.papelTrabajoDescripcion,
      // papeltrabajo_folios:actividadData.papelTrabajoFolios,
      // papeltrabajo_medio:actividadData.papelTrabajoMedio,
      // papeltrabajo_carpeta:actividadData.papelTrabajoCarpeta,
    };

    console.debug('Editar actividad json:', actividadJson);

    this.alertaService
      .showConfirmAlert("¿Está seguro(a) de editar el registro?")
      .then((result) => {
        if (result.isConfirmed) {
          this.planAnualAuditoriaService
            .put(`actividad`, actividadJson)
            .subscribe(
              (response) => {
                if (response) {
                  this.alertaService.showSuccessAlert("Mock Registro Editado");
                  this.datos.push(response);
                  this.dialogRef.close(true);
                } else {
                  this.alertaService.showErrorAlert(
                    "Error al editar el registro"
                  );
                }
              },
              (error) => {
                console.error("error al editar actividad:", error);
                this.alertaService.showErrorAlert(
                  "Error al editar el registro"
                );
              }
            );
        }
      })
      .catch((error) => {
        console.error("Error al editar actividad", error);
        this.alertaService.showErrorAlert("Error al editar el registro");
      });
  }
}
