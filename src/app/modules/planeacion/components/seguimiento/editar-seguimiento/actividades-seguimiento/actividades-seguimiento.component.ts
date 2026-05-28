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
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { environment } from "src/environments/environment";
import { RolService } from "src/app/core/services/rol.service";
import { mostrarAccionPlaneacionMarcarActividadCompletada } from "src/app/shared/utils/accionesPorRolYEstado";

@Component({
    selector: "app-actividades-seguimiento",
    templateUrl: "./actividades-seguimiento.component.html",
    styleUrls: ["./actividades-seguimiento.component.css"],
    standalone: false
})
export class ActividadesSeguimientoComponent implements OnInit {
  @Input() idAuditoria!: string;
  @Input() soloLectura: boolean = false;
  @Input() minFechaStr?: string;
  @Input() maxFechaStr?: string;
  datos = new MatTableDataSource<any>([]);
  mostrarMarcarCompletada: boolean = false;
  
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
    "completada",
    "acciones",
  ];

  constructor(
    public readonly dialog: MatDialog,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly alertaService: AlertService,
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService,
    private readonly nuxeoService: NuxeoService,
    private readonly descargaService: DescargaService,
    private readonly rolService: RolService
  ) { }

  resetComponent() {
    console.log("Reseteando componente de actividades de seguimiento");
  }
  
  onStepLeave() {
    this.resetComponent();
  }
  ngOnInit(): void {
    if (this.soloLectura) {
      this.columnsToDisplay = this.columnsToDisplay.filter(col => col !== "acciones");
    }
    this.cargarMostrarCargarCompletada();
    this.listaractividades();
  }

  cargarMostrarCargarCompletada() {
    let url = "auditoria-estado";
    url += `?query=auditoria_id:${this.idAuditoria},actual:true,activo:true`;
    url += "&sortby=_id",
    url += "&order=desc";
    url += "&limit=1";
    this.planAnualAuditoriaService.get(url).subscribe({
      next: (res) => {
        const estadoAuditoria = res.Data[0]?.estado_id || 0;
        const roles = this.rolService.getRoles();

        this.mostrarMarcarCompletada = roles.some((rol: string) =>
          mostrarAccionPlaneacionMarcarActividadCompletada(rol, estadoAuditoria)
        );
        if (this.mostrarMarcarCompletada) {
          this.columnsToDisplay.push("acciones");
        }
      },
      error: (error) => {
        console.error("Error al cargar el estado de la auditoría:", error);
        this.alertaService.showErrorAlert("Error al cargar el estado de la auditoría");
      }
    });
  }

  marcarCompletada(actividad: ActividadPlan): void {
    this.alertaService
      .showConfirmAlert("¿Está seguro(a) de marcar esta actividad como completada? Esta acción no puede deshacerse.")
      .then((result) => {
        if (result.isConfirmed) {
          const actividadActualizada = { ...actividad, completada: true };
          this.planAnualAuditoriaService.put(`actividad/${actividad.id}`, actividadActualizada).subscribe({
            next: () => {
              this.alertaService.showSuccessAlert("Actividad marcada como completada");
              this.listaractividades();
            },
            error: (error) => {
              console.error("Error al marcar la actividad como completada:", error);
              this.alertaService.showErrorAlert("Error al marcar la actividad como completada");
            }
          });
        }
      })
      .catch((error) => {
        console.error("Error al confirmar la acción:", error);
        this.alertaService.showErrorAlert("Error al marcar la actividad como completada");
      });
  }

  subirArchivo(tipoArchivo: string): void {
    this.dialog.open(CargarArchivoComponent, {
      width: "600px",
      data: { tipoArchivo },
    });
  }
  listaractividades() {
    this.planAuditoriaMid
      .get(`actividad?query=auditoria_id:${this.idAuditoria},activo:true&limit=0`)
      .subscribe((res) => {
        const actividades: any[] = res.Data;

        if (actividades.length === 0) {
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
            completada: item.completada || false,
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

  // Descarga la plantilla de cargue masivo de actividades desde el gestor documental.
    async descargarPlantilla(): Promise<void> {
      try {
        const base64 = await this.nuxeoService.obtenerPorUUID(
          environment.PLANTILLA_CARGUE_MASIVO_ACTIVIDADES
        );
        await this.descargaService.descargarArchivo(
          base64,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'plantilla_actividades'
        );
      } catch (error) {
        console.error('Error al descargar la plantilla de actividades:', error);
        this.alertaService.showErrorAlert('Error al descargar la plantilla');
      }
    }
  
}
