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
import { ModalVisualizarRecargarDocumentoComponent } from "./modal-visualizar-recargar-documento/modal-visualizar-recargar-documento.component";
import { CargarArchivoComponent } from "src/app/shared/elements/components/cargar-archivo/cargar-archivo.component";
import { environment } from "src/environments/environment";
import { ModalVerDocumentosComponent } from "src/app/shared/elements/components/dialogs/modal-ver-documentos/modal-ver-documentos.component";
import { RolService } from "src/app/core/services/rol.service";
import descargarAuditorias from "src/app/shared/utils/descargarAuditorias";

//servicios
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { SpinnerService } from "src/app/shared/services/spinner.service";
import { UserService } from "src/app/core/services/user.service";

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
  modoEditar: boolean = true;
  vigenciaId: number = 0;
  idMatriz: any = null;
  base64Matriz: any = null;
  ordenSeleccionado: string = '';
  mostrarOrdenamiento: boolean = false;
  estadoIdActual: number | null = null;
  title: string = "";
  breadcrumb: string = "";
  usuario_id: number | null = null;
  roles: string[] = [];
  vigenciaNombre: string = "";

  constructor(
    private alertaService: AlertService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    private PlanAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private nuxeoService: NuxeoService,
    private descargaService: DescargaService,
    private router: Router,
    private spinnerService: SpinnerService,
    private rolService: RolService,
    private userService: UserService
  ) { }

  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get("id") ?? "1";
    const vigencia = JSON.parse(localStorage.getItem('vigencia') || '{}');
    this.vigenciaId = vigencia?.Id || 0;
    this.vigenciaNombre = vigencia?.Nombre || '';
    localStorage.removeItem('vigencia');
    await this.obtenerEstadoActual();
    this.cargarAuditorias();
    try {
      this.idMatriz = await this.buscarMatriz();
      if (this.idMatriz !== null) {
        this.buscarBase64(this.idMatriz);
      }
    } catch (error) {
      console.error("Error al cargar Matriz", error);
    }
    this.userService.getPersonaId().then((id) => {
      this.usuario_id = id;
    });
    this.breadcrumb = `<p>Gestión Auditoría / Programación / Plan Anual de Auditorías / <b>${this.modoEditar ? 'Registrar Auditorías' : 'Ver Auditorías'}</b></p>`;
    this.title = `${this.modoEditar ? 'Registrar' : ''} Auditorías del Plan Anual de Auditoría (PAA)`;
  }

  cargarAuditorias(): void {
    let url = `auditoria/ordenadas?query=plan_auditoria_id:${this.id}&limit=0&populate=true`;
    
    if (this.ordenSeleccionado) {
      url += `&orderBy=${this.ordenSeleccionado}&orderDirection=ASC`;
    }

    this.PlanAnualAuditoriaMid.get(url).subscribe(
      (res) => {
        if (res.Data && res.Data.length > 0) {
          this.dataSource.data = res.Data.map((item: any) => ({
            id: item._id ?? 0,
            auditoria: item.titulo ?? "Sin Título",
            tipoEvaluacion: item.tipo_evaluacion_nombre ?? "Sin Tipo",
            tipoEvaluacionId: item.tipo_evaluacion_id ?? 0,
            macroproceso: item.macroproceso_nombre ?? "Sin Macroproceso",
            macroprocesoId: item.macroproceso_id ?? 0,
            proceso: item.proceso_nombre ?? "Sin Proceso",
            procesoId: item.proceso_id ?? 0,
            dependencia: item.dependencia_nombre ?? "Sin Dependencia",
            dependenciaId: item.dependencia_id ?? 0,
            cronograma: item.cronograma ?? "Sin Cronograma",
            cronogramaId: item.cronograma_id ?? [],
            estado: item.estado_nombre ?? "Sin estado",
          }));
          
          this.actualizarColumnas();
        }
      },
      (error) => {
        this.alertaService.showErrorAlert("Error al cargar las auditorías");
      }
    );
  }

  aplicarOrdenamiento(): void {
    this.cargarAuditorias();
  }

  actualizarColumnas(): void {
    this.displayedColumns = [
      "no",
      "auditoria",
      "tipoEvaluacion",
      "cronograma",
      "estado",
    ];

    // Agrega la columna de acciones solo si modoEditar es true
    if (this.modoEditar) {
      this.displayedColumns.push("acciones");
    }
  }

  async obtenerEstadoActual(): Promise<void> {
    try {
      await this.rolService.cargarRoles();
      this.roles = this.rolService.getRoles();
      
      const response = await this.planAnualAuditoriaService
        .get(`estado?query=plan_auditoria_id:${this.id},actual:true`)
        .toPromise();
      const estadoActual = response?.Data?.[0];
      this.estadoIdActual = estadoActual?.estado_id || null;

      // Si no hay estado, asumir que está en borrador
      if (this.estadoIdActual === null) {
        console.warn('Plan sin estado asignado, asumiendo estado EN_BORRADOR');
        this.estadoIdActual = environment.PLAN_ESTADO.EN_BORRADOR_ID;
      }

      console.log('Roles del usuario:', this.roles);
      const esAuditorExperto = this.roles.includes('AUDITOR_EXPERTO');
      const esJefeControlInterno = this.roles.includes('JEFE_CONTROL_INTERNO');
      const enRevisionJefe = this.estadoIdActual === environment.PLAN_ESTADO.EN_REVISION_JEFE_ID;

      this.modoEditar =
        (this.estadoIdActual === environment.PLAN_ESTADO.EN_BORRADOR_ID ||
        this.estadoIdActual === environment.PLAN_ESTADO.RECHAZADO) ||
        (enRevisionJefe && !esAuditorExperto);

      this.mostrarOrdenamiento = 
        (esAuditorExperto || esJefeControlInterno) && 
        (this.estadoIdActual === environment.PLAN_ESTADO.EN_BORRADOR_ID || this.estadoIdActual === environment.PLAN_ESTADO.EN_REVISION_JEFE_ID);
    } catch (error) {
      console.error("Error al obtener el estado actual:", error);
      this.modoEditar = false;
    }
  }

  // Función para manejar el evento de drag-and-drop
  drop(event: CdkDragDrop<Auditoria[]>): void {
    if (!this.modoEditar) {
      return;
    }
    const prevData = [...this.dataSource.data];
    moveItemInArray(prevData, event.previousIndex, event.currentIndex);
    this.dataSource.data = prevData;
  }

  async descargarPlantilla(): Promise<void> {
    try {
      const base64File = await this.nuxeoService.obtenerPorUUID(
        environment.PLANTILLA_CARGUE_MASIVO
      );
      await this.descargaService.descargarArchivo(
        base64File,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "plantilla"
      );
    } catch (error) {
      console.error("Error al descargar la plantilla:", error);
      this.alertaService.showErrorAlert("Error al descargar la plantilla");
    }
  }

  // Eliminar auditoría
  borrarAuditoria(element: Auditoria) {
    this.alertaService
      .showConfirmAlert("¿Está seguro(a) de eliminar el registro?")
      .then(
        (result) => {
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
        "¿Está seguro(a) de guardar el Plan Anual de Auditoría (PAA)?"
      )
      .then((result) => {
        if (result.isConfirmed) {
          const auditoriaIds = this.dataSource.data.map(
            (auditoria) => auditoria.id
          );

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
        usuario_id: this.usuario_id,
        usuario_rol: [environment.ROL.AUDITOR_EXPERTO, environment.ROL.AUDITOR, environment.ROL.AUDITOR_ASISTENTE].find(rol => this.rolService.tieneRol(rol)),
        tipoArchivo: "xlsx",
        id: this.id,
        vigenciaId: this.vigenciaId,
        idTipoDocumento: environment.TIPO_DOCUMENTO.PLANES_AUDITORIA,
        descripcion: "Archivo para cargue masivo",
        cargaLambda: true,
        tipo: "auditorias",
      },
    });
  }

  subirArchivoMatriz(): void {
    const dialogRef = this.dialog.open(CargarArchivoComponent, {
      width: "800px",
      data: {
        tipoArchivo: "pdf",
        id: this.id,
        idTipoDocumento: environment.TIPO_DOCUMENTO.MATRIZ_FUNCION_PUBLICA,
        descripcion: "Matriz función pública",
        cargaLambda: false,
        tipoIdReferencia:
          environment.TIPO_DOCUMENTO_PARAMETROS.MATRIZ_FUNCION_PUBLICA,
      },
    });
  }

  // Guardar cambios
  saveChanges(): void {
    console.log("Nuevo orden de auditorías:", this.dataSource.data);
  }

  agregarAuditoria(auditoria?: Auditoria) {
    const dialogRef = this.dialog.open(AddAuditoriaModalComponent, {
      width: "1000px",
      data: {
        usuario_id: this.usuario_id,
        usuario_rol: [environment.ROL.AUDITOR_EXPERTO, environment.ROL.AUDITOR, environment.ROL.AUDITOR_ASISTENTE].find(rol => this.rolService.tieneRol(rol)),
        planAuditoriaId: this.id,
        vigenciaId: this.vigenciaId,
        auditoria,
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
        this.alertaService.showErrorAlert("Error al cargar el PDF");
      }
    );
  }

  regresarRuta() {
    this.router.navigate([`/programacion/plan-auditoria`]);
  }

  verDocumentos() {
    this.dialog.open(ModalVerDocumentosComponent, {
      width: "1200px",
      data: {
        entityId: this.id,
      },
    });
  }
  buscarMatriz(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.planAnualAuditoriaService.get(`documento?query=referencia_id:${this.id},referencia_tipo:Plan Auditoria,tipo_id:${environment.TIPO_DOCUMENTO_PARAMETROS.MATRIZ_FUNCION_PUBLICA},activo:true&fields=nuxeo_enlace`)
        .subscribe(
          (res) => {
            if (res && Array.isArray(res.Data) && res.Data.length > 0) {
              resolve(res.Data[0].nuxeo_enlace); // Tomar el primer valor
            } else {
              resolve(null);
            }
          },
          (error) => {
            console.error("Error al buscar Matriz", error);
            this.alertaService.showErrorAlert("Error al buscar Matriz");
            reject(error);
          }
        );
    });
  }
  async buscarBase64(nuxeoId: string) {
    this.base64Matriz = await this.nuxeoService.obtenerPorUUID(nuxeoId);
  }
  verMatriz() {
    this.dialog.open(ModalVisualizarRecargarDocumentoComponent, {
      data: { base64Document: this.base64Matriz, id: this.id },
      width: "80%",
      height: "80vh",
    });
  }

  /** Download the Excel file for bulk audit upload */
  async descargarArchivoDescargueMasivo() {
    try {
      this.spinnerService.show();
      const base64File = await this.nuxeoService.obtenerPorUUID(
        environment.PLANTILLA_CARGUE_MASIVO
      );
      const buffer = await descargarAuditorias(this.dataSource.data, base64File);
      await this.descargaService.descargarArchivoBuffer(
        buffer,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        environment.NOMBRE_ARCHIVO_DESCARGA_AUDITORIAS,
      );
    } catch (error) {
      console.error("Error al descargar el archivo de auditorías:", error);
      this.alertaService.showErrorAlert("Error al descargar el archivo de auditorías");
    } finally {
      this.spinnerService.hide();
    }
  }

}
