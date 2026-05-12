import { Component, Input, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActividadFormularioComponent } from '../actividad-formulario/actividad-formulario.component'
import { AlertService } from "src/app/shared/services/alert.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { Actividad as ActividadPlan } from 'src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria';
import { Actividad } from 'src/app/shared/data/models/actividad';


@Component({
  selector: 'app-editar-actividad',
  templateUrl: './editar-actividad.component.html',
  styleUrl: './editar-actividad.component.css'
})
export class EditarActividadComponent implements OnInit {
  //@Input() actividadData: any = {}; 
  /*actividad = {
    nombreActividad: 'Actividad Ejemplo',
    fechaInicio: new Date('2025-01-01'),
    fechaFin: new Date('2025-01-15'),
  };*/
  actividadData: ActividadPlan;
  idAuditoria: string;
  minFechaStr: string | null = null;
  maxFechaStr: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      actividad: ActividadPlan;
      idAuditoria: string;
      minFechaStr?: string;
      maxFechaStr?: string;
    },
    private readonly dialogRef: MatDialogRef<EditarActividadComponent>,
    private readonly alertaService: AlertService,
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService,
  ) {
    this.actividadData = data.actividad;
    this.idAuditoria = data.idAuditoria;
    this.minFechaStr = data.minFechaStr ?? null;
    this.maxFechaStr = data.maxFechaStr ?? null;
    console.debug('Actividad Data:', this.actividadData);
    console.debug('ID Auditoria:', this.idAuditoria);
  }

  ngOnInit(): void {}

  editarActividad(actividadData: ActividadPlan) {
    console.debug('Editar actividad:', actividadData);
    let actividadJson: Actividad = {
      auditoria_id: this.idAuditoria,
      titulo: actividadData.actividad,
      fecha_inicio: actividadData.fechaInicio.toISOString(),
      fecha_fin: actividadData.fechaFin.toISOString(),
      observacion: actividadData.observaciones,
      referencia: actividadData.papelTrabajoReferencia,
      descripcion: actividadData.papelTrabajoDescripcion,
      folio: actividadData.papelTrabajoFolios,
      medio: actividadData.papelTrabajoMedio,
      carpeta: actividadData.papelTrabajoCarpeta
    };

    console.debug('Editar actividad json:', actividadJson);
    this.alertaService
      .showConfirmAlert("¿Está seguro(a) de editar el registro?")
      .then((result) => {
        if (result.isConfirmed) {
          this.planAnualAuditoriaService
            .put(`actividad/${actividadData.id}`, actividadJson)
            .subscribe(
              (response) => {
                if (response) {
                  this.alertaService.showSuccessAlert("Registro Editado");
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
