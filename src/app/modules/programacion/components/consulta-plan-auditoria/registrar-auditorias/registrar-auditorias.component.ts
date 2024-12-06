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

  constructor(
    private alertaSevice: AlertService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    private PlanAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get("id") ?? "1";
    this.loadAuditoriasFromService();
  }

  loadAuditoriasFromService(): void {
    this.PlanAnualAuditoriaMid
      .get(`auditoria?query=plan_auditoria_id:${this.id}`)
      .subscribe(
        (res) => {
          if (res && res.Data) {
            this.dataSource.data = res.Data.filter(
              (item: any) => item.activo === true
            ).map((item: any) => ({
              id: item._id ?? 0,
              auditoria: item.titulo ?? "Sin Título",
              tipoEvaluacion: item.tipo_evaluacion_nombre ?? "Sin Tipo",
              tipoEvaluacionId: item.tipo_evaluacion_id ?? 0,
              cronograma: item.cronograma_nombre ?? "Sin Cronograma",
              cronogramaId: item.cronograma_id ?? [],
              estado: item.estado_id ?? "Desconocido",
            }));
          }
        },
        (error) => {
          this.alertaSevice.showErrorAlert("Error al cargar las auditorías");
        }
      );
  }

  // Función para manejar el evento de drag-and-drop
  drop(event: CdkDragDrop<Auditoria[]>): void {
    const prevData = [...this.dataSource.data];
    moveItemInArray(prevData, event.previousIndex, event.currentIndex);
    this.dataSource.data = prevData;
  }

  // Eliminar auditoría
  deleteAuditoria(element: Auditoria) {
    this.alertaSevice
      .showConfirmAlert("¿Está seguro(a) de eliminar el registro?")
      .then((result) => {
        if (result.isConfirmed) {
          this.planAnualAuditoriaService
            .delete(`auditoria`, element)
            .subscribe(
              (response) => {
                if (response) {
                  this.alertaSevice.showSuccessAlert("Registro eliminado");
                  this.dataSource.data = this.dataSource.data.filter(
                    (e) => e.id !== element.id
                  );
                } else {
                  this.alertaSevice.showErrorAlert(
                    "Error al eliminar el registro"
                  );
                }
              },
              (error) => {
                this.alertaSevice.showErrorAlert(
                  "Error al eliminar el registro"
                );
              }
            );
        }
      });
  }

  GuardarPaa() {
    this.alertaSevice
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
                this.alertaSevice.showSuccessAlert(
                  "El Plan Anual de Auditoría fue guardado exitosamente"
                );
              },
              (error) => {
                console.error("Error al guardar el PAA:", error);
                this.alertaSevice.showErrorAlert(
                  "Hubo un error al guardar el Plan Anual de Auditoría"
                );
              }
            );
        }
      });
  }

  subirArchivo(tipoArchivo: string): void {
    const dialogRef = this.dialog.open(CargarArchivoComponent, {
      width: "600px",
      data: { tipoArchivo, id: this.id },
    });
  }

  // Guardar cambios
  saveChanges(): void {
    console.log("Nuevo orden de auditorías:", this.dataSource.data);
  }

  addAuditoria(auditoria?: Auditoria) {
    // const nombreFormulario = 'sisifo_form2';
    // window.location.href = `http://localhost:4200/formularios-dinamicos/view-formulario/${nombreFormulario}`;
    const dialogRef = this.dialog.open(AddAuditoriaModalComponent, {
      width: "1000px",
      data: {
        planAuditoriaId: this.id,
        auditoria,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        console.log("Auditoría guardada o actualizada");
        this.loadAuditoriasFromService(); // Refrescar la lista después de guardar o actualizar.
      }
    });
  }

  // Editar auditoría
  editAuditoria(auditoria: Auditoria) {
    // const nombreFormulario = 'sisifo_form2';
    // window.location.href = `http://localhost:4200/formularios-dinamicos/editInfo-formulario/${nombreFormulario}/${index + 1}`;
    this.addAuditoria(auditoria);
  }

  renderizar() {
    this.PlanAnualAuditoriaMid.get(`plantilla/${this.id}`).subscribe(
      (res) => {
        if (res && res.Data) {
          console.log("DATA ", res.Data);
          this.dialog.open(ModalPdfVisualizadorComponent, {
            data: { base64Document: res.Data, id: this.id },
            width: "80%",
            height: "80vh",
          });
        } else {
          this.alertaSevice.showAlert("Aviso", "No se pudo cargar el PDF");
        }
      },
      (error) => {
        console.log("-----------", error);
        this.alertaSevice.showErrorAlert("Error al cargar el PDF");
      }
    );
  }

  regresarRuta() {
    this.router.navigate([`/programacion/plan-auditoria`]);
  }
}
