import { Component, OnInit, Input } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { CargarArchivoComponent } from "src/app/shared/elements/components/cargar-archivo/cargar-archivo.component";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { Actividad } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria"
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import  { EditarActividadComponent } from './editar-actividad/editar-actividad.component'
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-actividades-auditoria",
  templateUrl: "./actividades-auditoria.component.html",
  styleUrls: ["./actividades-auditoria.component.css"],
})
export class ActividadesAuditoriaComponent implements OnInit {
  @Input() idAuditoria!: String;
  datos: any;
  
  /*datos = [
    {
      actividad: "Título de la actividad 1",
      fechaInicio: "2024-01-01",
      fechaFin: "2024-01-10",
      ref: "Ref 1",
      descripcion: "Descripción 1",
      folios: "10",
      medio: "Digital",
      carpeta: "Carpeta A",
    },
    {
      actividad: "Título de la actividad 2",
      fechaInicio: "2024-02-01",
      fechaFin: "2024-02-05",
      ref: "Ref 2",
      descripcion: "Descripción 2",
      folios: "15",
      medio: "Físico",
      carpeta: "Carpeta B",
    },
  ];*/
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
    private nuxeoService: NuxeoService,
    private descargaService: DescargaService,
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
        //console.log("ACTB", actividades)
        this.datos = actividades.map((item) => ({
          id: item._id,
          actividad: item.titulo,
          fechaInicio: new Date(item.fecha_inicio).toLocaleDateString(),
          fechaFin: new Date(item.fecha_fin).toLocaleDateString(),
          //ref: item.referencia,
          //descripcion: item.descripcion,
          //folios: item.folio?.toString() || "",
          //medio: item.medio_id || "",  
          //carpeta: item.carpeta || ""
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
  editarActividad(actividad: Actividad){
    
    const dialogRef = this.dialog.open(EditarActividadComponent, {
      width: '1100px', 
      data: { 
        actividad: actividad, 
        idAuditoria: this.idAuditoria, 
      } 
    });
  }
}