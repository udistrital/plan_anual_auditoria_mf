import { Component, OnInit, Input } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { CargarArchivoComponent } from "src/app/shared/elements/components/cargar-archivo/cargar-archivo.component";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { Actividad as ActividadPlan } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria"
import { Actividad } from "src/app/shared/data/models/actividad";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import  { EditarActividadSeguimientoComponent } from './editar-actividad/editar-actividad.component'

@Component({
  selector: "app-actividades-seguimiento",
  templateUrl: "./actividades-seguimiento.component.html",
  styleUrls: ["./actividades-seguimiento.component.css"],
})
export class ActividadesSeguimientoComponent implements OnInit {
  @Input() idAuditoria!: string;
  @Input() soloLectura: boolean = false;
  @Input() minFechaStr?: String;
  @Input() maxFechaStr?: String;
  datos = new MatTableDataSource<any>([]);
  
  columnsToDisplay: string[] = [
    "no",
    "actividad",
    "fechaInicio",
    "fechaFin",
    "referencia",
    "descripcion",
    "folio",
    "carpeta",
    "medio",
    "observaciones",
    "acciones",
  ];

  constructor(
    public dialog: MatDialog,
    private planAuditoriaMid: PlanAnualAuditoriaMid,
    private alertaService: AlertService,
    private planAnualAuditoriaService:PlanAnualAuditoriaService,
    
  ) { }

  resetComponent() { }
  onStepLeave() {
    this.resetComponent();
  }
  ngOnInit(): void {
    if (this.soloLectura) {
      this.columnsToDisplay = this.columnsToDisplay.filter(col => col !== "acciones");
    }
    this.listaractividades();
   }

  subirArchivo(tipoArchivo: string): void {
    const dialogRef = this.dialog.open(CargarArchivoComponent, {
      width: "600px",
      data: { tipoArchivo },
    });
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
        this.datos = new MatTableDataSource( 
          actividades.map((item: Actividad): ActividadPlan => ({
            id: item._id,
            actividad: item.titulo,
            fechaInicio: new Date(item.fecha_inicio),
            fechaFin: new Date(item.fecha_fin),
            observaciones: item.observacion,
            papelTrabajoReferencia: item.referencia,
            papelTrabajoDescripcion: item.descripcion,
            papelTrabajoFolios: item.folio,
            papelTrabajoMedio: item.medio,
            papelTrabajoCarpeta: item.carpeta
          })
        ));
      });
      
  }
  eliminarActividad(actividad: any) {
    if (this.soloLectura) {
      return;
    }

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
                  this.datos.data = this.datos.data.filter(
                    (e:any) => e.id !== actividad.id
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

  editarActividad(actividad: ActividadPlan){
    const dialogRef = this.dialog.open(EditarActividadSeguimientoComponent, {
      width: '1100px', 
      data: { 
        actividad: actividad, 
        idAuditoria: this.idAuditoria,
        minFechaStr: this.minFechaStr,
        maxFechaStr: this.maxFechaStr,
      } 
    });

    // Refresca la lista tras editar una actividad.
    dialogRef.afterClosed().subscribe(() => {
      this.listaractividades()
    });
  }
}
