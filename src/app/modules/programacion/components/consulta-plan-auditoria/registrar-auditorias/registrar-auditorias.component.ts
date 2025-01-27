import { Component, OnInit } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { ActivatedRoute, Router } from "@angular/router";
import { AddAuditoriaModalComponent } from "./add-auditoria-modal/add-auditoria-modal.component";
import { MatDialog } from "@angular/material/dialog";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { Auditoria } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria";
import { ModalPdfVisualizadorComponent } from "./pdf-visualizador-modal/pdf-visualizador.component";
import { CargarArchivoComponent } from "src/app/shared/elements/components/cargar-archivo/cargar-archivo.component";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";
import { ModalVerDocumentosPlanComponent } from "../modal-ver-documentos-plan/modal-ver-documentos-plan.component";
import { NuxeoService } from "src/app/core/services/nuxeo.service";

@Component({
  selector: "app-registrar-auditorias",
  templateUrl: "./registrar-auditorias.component.html",
  styleUrls: ["./registrar-auditorias.component.css"],
})
export class RegistrarAuditoriasComponent implements OnInit {
  displayedColumns: string[] = [
    "no",
    "auditoria",
    "tipoEvaluacion",
    "cronograma",
    "estado",
    "acciones",
  ];
  dataSource = new MatTableDataSource<Auditoria>([]);
  id: string = "";
  mostrarBotones: boolean = true;
  vigenciaId: number = 6619;

  constructor(
    private alertaService: AlertService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    private PlanAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private nuxeoService: NuxeoService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get("id") ?? "1";
    this.cargarVigencia();
    this.cargarAuditorias();
    await this.obtenerEstadoActual();
  }

  cargarVigencia(): void{
    this.planAnualAuditoriaService
      .get(`plan-auditoria/${this.id}?fields=vigencia_id`)
      .subscribe(
        (res) => {
          if (res && res.Data) {
            this.vigenciaId = res.Data.vigencia_id;
          }
        },
        (error) => {
          this.alertaService.showErrorAlert("Error al cargar la vigencia");
        }
      );
  }

  cargarAuditorias(): void {
    this.PlanAnualAuditoriaMid
      .get(`auditoria/ordenadas?query=plan_auditoria_id:${this.id}&limit=0&populate=true`)
      .subscribe(
        (res) => {
          if (res && res.Data) {
            this.dataSource.data = res.Data.map((item: any) => ({
              id: item._id ?? 0,
              auditoria: item.titulo ?? "Sin Título",
              tipoEvaluacion: item.tipo_evaluacion_nombre ?? "Sin Tipo",
              tipoEvaluacionId: item.tipo_evaluacion_id ?? 0,
              cronograma: item.cronograma_nombre ?? "Sin Cronograma",
              cronogramaId: item.cronograma_id ?? [],
              estado: item.estado_id ?? "Borrador",
            }));
            this.vigenciaId = res.Data[0].plan_auditoria_id?.vigencia_id;
            this.actualizarColumnas();
          }
        },
        (error) => {
          this.alertaService.showErrorAlert("Error al cargar las auditorías");
        }
      );
  }

  actualizarColumnas(): void {
    this.displayedColumns = [
      "no",
      "auditoria",
      "tipoEvaluacion",
      "cronograma",
      "estado",
    ];
  
    // Agrega la columna de acciones solo si mostrarBotones es true
    if (this.mostrarBotones) {
      this.displayedColumns.push("acciones");
    }
  }
  
  async obtenerEstadoActual(): Promise<void> {
    try {
      const response = await this.planAnualAuditoriaService
        .get(`estado?query=plan_auditoria_id:${this.id},actual:true`)
        .toPromise();
      const estadoActual = response?.Data?.[0];
      const estadoIdActual = estadoActual?.estado_id || null;

      this.mostrarBotones =
        estadoIdActual === environment.PLAN_ESTADO.EN_BORRADOR_ID ||
        estadoIdActual === environment.PLAN_ESTADO.EN_RECHAZO_ID;
    } catch (error) {
      console.error("Error al obtener el estado actual:", error);
      this.mostrarBotones = false;
    }
  }

  // Función para manejar el evento de drag-and-drop
  drop(event: CdkDragDrop<Auditoria[]>): void {
    if (!this.mostrarBotones) {
      return;
    }
    const prevData = [...this.dataSource.data];
    moveItemInArray(prevData, event.previousIndex, event.currentIndex);
    this.dataSource.data = prevData;
  }

  async descargarPlantilla(): Promise<void> {
    try {
      const base64File = await this.nuxeoService.obtenerPorUUID(environment.PLANTILLA_CARGUE_MASIVO);
      const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; 
      const fileName = "plantilla"; 

      const arrayBuffer = this.base64ToArrayBuffer(base64File);
      const blob = new Blob([arrayBuffer], { type: fileType });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.${this.obtenerExtencionMimeType(fileType)}`;
      link.target = "_blank";
      link.click();

      // Limpiar URL temporal
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar la plantilla:", error);
      this.alertaService.showErrorAlert("Error al descargar la plantilla");
    }
  }

  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  obtenerExtencionMimeType(mimeType: string): string {
    const mimeMap: { [key: string]: string } = {
      "application/pdf": "pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
      "text/plain": "txt",
      "application/json": "json",
    };
    return mimeMap[mimeType] || "file";
  }
  

  // Eliminar auditoría
  borrarAuditoria(element: Auditoria) {
    this.alertaService
      .showConfirmAlert("¿Está seguro(a) de eliminar el registro?")
      .then((result) => {
        if (result.isConfirmed) {
          this.planAnualAuditoriaService
            .delete(`auditoria`, element)
            .subscribe(
              (response) => {
                if (response) {
                  this.alertaService.showSuccessAlert("Registro eliminado");
                  this.dataSource.data = this.dataSource.data.filter(
                    (e) => e.id !== element.id
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
      },
      (error) => {
        this.alertaService.showErrorAlert("Error al eliminar el registro");
      }
    );
  }

  guardarPaa() {
    this.alertaService
      .showConfirmAlert(
        "¿Está seguro(a) de guardar el Plan Anual de Auditoría - PAA?"
      )
      .then((result) => {
        if (result.isConfirmed) {
          const auditoriaIds = this.dataSource.data.map(auditoria => auditoria.id);

          const payload = {
            auditorias: auditoriaIds,
          };

          this.planAnualAuditoriaService
            .put(`plan-auditoria/${this.id}`, payload)
            .subscribe(
              () => {
                this.alertaService.showSuccessAlert(
                  "El Plan Anual de Auditoría fue guardado exitosamente"
                );
              },
              (error) => {
                console.error("Error al guardar el PAA:", error);
                this.alertaService.showErrorAlert(
                  "Hubo un error al guardar el Plan Anual de Auditoría"
                );
              }
            );
        }
      });
  }

  subirArchivoCargueMasivo(): void {
    const dialogRef = this.dialog.open(CargarArchivoComponent, {
      width: "800px",
      data: {
        tipoArchivo: 'xlsx',
        id: this.id,
        vigenciaId: this.vigenciaId,
        idTipoDocumento: environment.TIPO_DOCUMENTO.PLANES_AUDITORIA,
        descripcion: 'Archivo para cargue masivo',
        cargaLambda: true,
        tipo: "auditorias"
      },
    });
  }

  subirArchivoMatriz(): void {
    const dialogRef = this.dialog.open(CargarArchivoComponent, {
      width: "800px",
      data: {
        tipoArchivo: 'pdf',
        id: this.id,
        idTipoDocumento: environment.TIPO_DOCUMENTO.MATRIZ_FUNCION_PUBLICA,
        descripcion: 'Matriz funcion publica',
        cargaLambda: false,
        tipoIdReferencia: environment.TIPO_DOCUMENTO_PARAMETROS.MATRIZ_FUNCION_PUBLICA
      },
    });
  }

  // Guardar cambios
  saveChanges(): void {
    console.log("Nuevo orden de auditorías:", this.dataSource.data);
  }

  agregarAuditoria(auditoria?: Auditoria) {
    // const nombreFormulario = 'sisifo_form2';
    // window.location.href = `http://localhost:4200/formularios-dinamicos/view-formulario/${nombreFormulario}`;
    const dialogRef = this.dialog.open(AddAuditoriaModalComponent, {
      width: "1000px",
      data: {
        planAuditoriaId: this.id,
        vigenciaId: this.vigenciaId,
        auditoria
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        console.log("Auditoría guardada o actualizada");
        this.cargarAuditorias();
      }
    });
  }

  // Editar auditoría
  editarAuditoria(auditoria: Auditoria) {
    // const nombreFormulario = 'sisifo_form2';
    // window.location.href = `http://localhost:4200/formularios-dinamicos/editInfo-formulario/${nombreFormulario}/${index + 1}`;
    this.agregarAuditoria(auditoria);
  }

  renderizar() {
    this.PlanAnualAuditoriaMid.get(`plantilla/${this.id}`).subscribe(
      (res) => {
        if (res && res.Data) {
          this.dialog.open(ModalPdfVisualizadorComponent, {
            data: { base64Document: res.Data, id: this.id },
            width: "80%",
            height: "80vh",
          });
        } else {
          this.alertaService.showAlert("Aviso", "No se pudo cargar el PDF");
        }
      },
      (error) => {
        console.log("-----------", error);
        this.alertaService.showErrorAlert("Error al cargar el PDF");
      }
    );
  }

  regresarRuta() {
    this.router.navigate([`/programacion/plan-auditoria`]);
  }

  verDocumentos() {
    const dialogRef = this.dialog.open(ModalVerDocumentosPlanComponent, {
      width: "1200px",
      data: {
        planAuditoriaId: this.id,
      },
    });
  }
}
