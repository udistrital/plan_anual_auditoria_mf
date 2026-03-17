import { Component, OnInit, Input } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { CargarArchivoComponent } from "src/app/shared/elements/components/cargar-archivo/cargar-archivo.component";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { Actividad } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria"
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import  { EditarActividadComponent } from './editar-actividad/editar-actividad.component'

@Component({
  selector: "app-actividades-auditoria",
  templateUrl: "./actividades-auditoria.component.html",
  styleUrls: ["./actividades-auditoria.component.css"],
})
export class ActividadesAuditoriaComponent implements OnInit {
  @Input() idAuditoria!: String;
  datos: any;

  columnsToDisplay: string[] = [
    "no",
    "actividad",
    "fechaInicio",
    "fechaFin",
    "acciones",
  ];

  constructor(
    public dialog: MatDialog,
    private planAuditoriaMid: PlanAnualAuditoriaMid,
    private alertaService: AlertService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
  ) { }

  resetComponent() { }
  onStepLeave() {
    this.resetComponent();
  }

  ngOnInit(): void {
    this.listaractividades();
  }

  subirArchivo(tipoArchivo: string): void {
    const dialogRef = this.dialog.open(CargarArchivoComponent, {
      width: "600px",
      data: { tipoArchivo },
    });
  }

  private parsearFechaLocal(fechaISO: string): string {
    if (!fechaISO) return '';
    return new Date(fechaISO.substring(0, 10) + "T00:00:00").toLocaleDateString();
  }

  listaractividades() {
    this.planAuditoriaMid
      .get(`actividad?query=auditoria_id:${this.idAuditoria},activo:true&limit=0`)
      .subscribe((res) => {
        const actividades: any[] = res.Data;

        if (!(actividades.length > 0)) {
          return this.alertaService.showAlert(
            "No hay actividades registradas",
            "Actualmente no hay actividades registradas para la vigencia seleccionada."
          );
        }

        this.datos = actividades.map((item) => ({
          id: item._id,
          actividad: item.titulo,
          fechaInicio: this.parsearFechaLocal(item.fecha_inicio),
          fechaFin: this.parsearFechaLocal(item.fecha_fin),
        }));
      });
  }

  eliminarActividad(actividad: any) {
    this.alertaService
      .showConfirmAlert("¿Está seguro(a) de eliminar el registro?")
      .then((result) => {
        if (result.isConfirmed) {
          this.planAnualAuditoriaService
            .delete(`actividad`, actividad)
            .subscribe(
              (response) => {
                if (response) {
                  this.alertaService.showSuccessAlert("Registro eliminado");
                  this.datos = this.datos.filter(
                    (e: any) => e.id !== actividad.id
                  );
                } else {
                  this.alertaService.showErrorAlert(
                    "Error al eliminar el registro"
                  );
                }
              },
              (error) => {
                this.alertaService.showErrorAlert(
                  "Error al eliminar el registro"
                );
              }
            );
        }
      })
      .catch(() => {
        this.alertaService.showErrorAlert("Error al eliminar el registro");
      });
  }

  editarActividad(actividad: Actividad) {
    const dialogRef = this.dialog.open(EditarActividadComponent, {
      width: '1100px',
      data: {
        actividad: actividad,
        idAuditoria: this.idAuditoria,
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.listaractividades();
    });
  }
}