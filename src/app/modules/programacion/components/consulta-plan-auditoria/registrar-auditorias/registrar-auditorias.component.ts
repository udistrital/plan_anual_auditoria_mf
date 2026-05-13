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
import { ModalAuditoriasHijasComponent, AuditoriaHija } from "./modal-auditorias-hijas/modal-auditorias-hijas.component";
import { CargarArchivoComponent } from "src/app/shared/elements/components/cargar-archivo/cargar-archivo.component";
import { environment } from "src/environments/environment";
import { RolService } from "src/app/core/services/rol.service";
import { DocumentoUtils } from "../consulta-plan.auditoria.utils";
import { firstValueFrom, map, catchError } from "rxjs";
import { Auditoria as AuditoriaModel } from "src/app/shared/data/models/auditoria";

//servicios
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { SpinnerService } from "src/app/shared/services/spinner.service";
import { UserService } from "src/app/core/services/user.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";

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
    "macroproceso",
    "proceso",
    "dependencia",
    "cronograma",
    "cantidadAuditorias",
    "estado",
    "acciones",
  ];
  dataSource = new MatTableDataSource<Auditoria>([]);
  id: string = "";
  modoEditar: boolean = true;
  modoEditarExtraordinario: boolean = false;
  vigenciaId: number = 0;
  idMatriz: any = null;
  base64Matriz: any = null;
  ordenSeleccionado: string = '';
  mostrarOrdenamiento: boolean = false;
  estadoIdActual: number | null = null;
  edicionExtraordinaria: string[] = [];

  title: string = "";
  breadcrumb: string = "";
  usuario_id: number | null = null;
  roles: string[] = [];
  vigenciaNombre: string = "";

  constructor(
    private readonly alertaService: AlertService,
    private readonly route: ActivatedRoute,
    private readonly dialog: MatDialog,
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService,
    private readonly PlanAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly nuxeoService: NuxeoService,
    private readonly descargaService: DescargaService,
    private readonly router: Router,
    private readonly spinnerService: SpinnerService,
    private readonly rolService: RolService,
    private readonly userService: UserService,
    private readonly documentoUtils: DocumentoUtils,
    private readonly referenciaPdfService: ReferenciaPdfService,
  ) { }

  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get("id") ?? "1";
    this.modoEditarExtraordinario = Boolean(localStorage.getItem('extra-edit'));
    const vigencia = JSON.parse(localStorage.getItem('vigencia') ?? '{}');
    this.vigenciaId = vigencia?.Id ?? 0;
    this.vigenciaNombre = vigencia?.Nombre ?? '';
    localStorage.removeItem('vigencia');
    localStorage.removeItem('extra-edit');
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
    this.breadcrumb = `<p>Gestión Auditoría / Programación / Plan Anual de Auditorías / <b>${this.modoEditar || this.modoEditarExtraordinario ? 'Registrar Auditorías' : 'Ver Auditorías'}</b></p>`;
    this.title = `${this.modoEditar || this.modoEditarExtraordinario ? 'Registrar' : ''} Auditorías del Plan Anual de Auditoría (PAA)`;
  }

  cargarAuditorias(): void {
    let url = `auditoria-padre/ordenadas?query=plan_auditoria_id:${this.id}&limit=0&populate=true`;
    
    if (this.ordenSeleccionado) {
      url += `&orderBy=${this.ordenSeleccionado}&orderDirection=ASC`;
    }

    this.PlanAnualAuditoriaMid.get(url).subscribe(
      (res) => {
        if (res?.Data?.length > 0) {
          this.dataSource.data = res.Data.map((item: AuditoriaModel): Partial<Auditoria> => {
            return {
              id: item._id ?? "",
              auditoria: item.titulo ?? "Sin Título",
              tipoEvaluacion: item.tipo_evaluacion_nombre ?? "Sin Tipo",
              tipoEvaluacionId: item.tipo_evaluacion_id ?? 0,
              macroprocesos: item.macroproceso ?? "Sin macroprocesos",
              macroprocesosId: item.macroproceso_id ?? [],
              procesos: item.proceso ?? "Sin procesos",
              procesosId: item.proceso_id ?? [],
              dependencias: item.dependencia ?? "Sin dependencias",
              dependenciasId: item.dependencia_id ?? [],
              cronograma: item.cronograma ?? "Sin Cronograma",
              cronogramaId: item.cronograma_id ?? [],
              estado: item.estado_nombre ?? "Sin estado",
              // Se mapea cantidad_auditorias con fallback a 0 según el requerimiento
              cantidadAuditorias: item.cantidad_auditorias ?? 0,
            };
          });
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
      "macroproceso",
      "proceso",
      "dependencia",
      "cronograma",
      "cantidadAuditorias",
      "estado",
    ];

    // Agrega la columna de acciones solo si modoEditar es true
    if (this.modoEditar || this.modoEditarExtraordinario) {
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
      this.estadoIdActual = estadoActual?.estado_id ?? null;

      // Si no hay estado, asumir que está en borrador
      if (this.estadoIdActual === null) {
        console.warn('Plan sin estado asignado, asumiendo estado EN_BORRADOR');
        this.estadoIdActual = environment.PLAN_ESTADO.EN_BORRADOR_ID;
      }

      const esAuditorExperto = this.roles.includes(environment.ROL.AUDITOR_EXPERTO);
      const esJefeControlInterno = this.roles.includes(environment.ROL.JEFE);
      const enRevisionJefe = this.estadoIdActual === environment.PLAN_ESTADO.EN_REVISION_JEFE_ID;

      this.modoEditar =
        (this.estadoIdActual === environment.PLAN_ESTADO.EN_BORRADOR_ID ||
        this.estadoIdActual === environment.PLAN_ESTADO.RECHAZADO) ||
        (enRevisionJefe && !esAuditorExperto);

                
      this.modoEditarExtraordinario = this.modoEditarExtraordinario && 
        ((esAuditorExperto || esJefeControlInterno) &&
        (this.estadoIdActual === environment.PLAN_ESTADO.APROBADO_SECRETARIO_ID));

      this.mostrarOrdenamiento =
        (esAuditorExperto || esJefeControlInterno) &&
        (this.estadoIdActual === environment.PLAN_ESTADO.EN_BORRADOR_ID ||
          this.estadoIdActual === environment.PLAN_ESTADO.RECHAZADO) ||
        (esJefeControlInterno && enRevisionJefe);
    } catch (error) {
      console.error("Error al obtener el estado actual:", error);
      this.modoEditar = false;
      this.modoEditarExtraordinario = false;
      this.mostrarOrdenamiento = false;
    }
  }

  // Función para manejar el evento de drag-and-drop
  drop(event: CdkDragDrop<Auditoria[]>): void {
    if (!this.modoEditar && !this.modoEditarExtraordinario) {
      return;
    }
    const prevData = [...this.dataSource.data];
    moveItemInArray(prevData, event.previousIndex, event.currentIndex);
    this.dataSource.data = prevData;
  }

  async descargarPlantilla(): Promise<void> {
    try {
      this.spinnerService.show();

      const plantilla = await firstValueFrom(
        this.PlanAnualAuditoriaMid.get(
          'cargue-masivo/auditorias/plantilla'
        )
        .pipe(
          map((res: any) => {
            if (!res?.base64)
              throw new Error("Respuesta inválida del servidor: base64 no encontrado");

            return res.base64;
          }),
          catchError((error) => { throw error; })
        )
      )

      await this.descargaService.descargarArchivo(
        plantilla,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "plantilla"
      );
    } catch (error) {
      console.error("Error al descargar la plantilla:", error);
      this.alertaService.showErrorAlert("Error al descargar la plantilla");
    } finally {
      this.spinnerService.hide();
    }
  }

  async exportarTabla(): Promise<void> {
    try {
      this.spinnerService.show();

      const excel = await firstValueFrom(
        this.PlanAnualAuditoriaMid.get(
          'cargue-masivo/auditorias/plan/' + this.id
        )
        .pipe(
          map((res: any) => {
            if (!res?.base64)
              throw new Error("Respuesta inválida del servidor: base64 no encontrado");

            return res.base64;
          }),
          catchError((error) => { throw error; })
        )
      )

      await this.descargaService.descargarArchivo(
        excel,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "auditorias_plan_auditoria_" + this.vigenciaNombre
      );
    } catch (error) {
      console.error("Error al exportar la tabla:", error);
      this.alertaService.showErrorAlert("Error al exportar la tabla");
    } finally {
      this.spinnerService.hide();
    }
  }

  private async obtenerAuditoriasHijas(auditoriaId: string, tituloPadre: string): Promise<AuditoriaHija[]> {
    try {
      const res = await this.PlanAnualAuditoriaMid
        .get(`auditoria?query=activo:true,_id:${auditoriaId}&limit=0`)
        .toPromise();
      if (!res?.Data?.length) return [];
      return res.Data.map((h: any) => ({
        nombre: h.subtitulo ? `${tituloPadre} - ${h.subtitulo}` : tituloPadre,
        estado: h.estado?.nombre ?? h.estado_nombre ?? 'Sin estado',
      }));
    } catch {
      return [];
    }
  }

  private async mostrarModalHijas(auditoriaId: string, tituloPadre: string, accion: 'editar' | 'eliminar'): Promise<boolean> {
    const hijas = await this.obtenerAuditoriasHijas(auditoriaId, tituloPadre);
    const ref = this.dialog.open(ModalAuditoriasHijasComponent, {
      width: '700px',
      data: { hijas, accion },
    });
    return firstValueFrom(ref.afterClosed()).then(r => !!r);
  }

  // Eliminar auditoría
  async borrarAuditoria(element: Auditoria) {
    if (!element.id) {
      this.alertaService.showErrorAlert("Error: ID de auditoría no válido");
      return;
    }

    if (this.modoEditarExtraordinario) {
      const continuar = await this.mostrarModalHijas(element.id, element.auditoria, 'eliminar');
      if (!continuar) return;
      this.ejecutarEliminacion(element);
      return;
    }

    this.alertaService
      .showConfirmAlert(`¿Está seguro(a) de eliminar el registro?`)
      .then(
        (result) => {
          if (result.isConfirmed) this.ejecutarEliminacion(element);
        },
        () => this.alertaService.showErrorAlert("Error al eliminar el registro")
      );
  }

  private ejecutarEliminacion(element: Auditoria): void {
    const payload = {
      usuario_id: this.usuario_id,
      usuario_rol: [environment.ROL.AUDITOR_EXPERTO, environment.ROL.AUDITOR, environment.ROL.AUDITOR_ASISTENTE].find(rol => this.rolService.tieneRol(rol)),
      observacion: 'Auditoría eliminada',
      estado_id: environment.AUDITORIA_PADRE_ESTADO.ELIMINADA_ID,
      fase_id: null,
    };

    this.planAnualAuditoriaService
      .deleteWithBody(`auditoria-gestion/${this.id}/auditoria/${element.id}`, payload)
      .subscribe(
        (response) => {
          if (response) {
            this.alertaService.showSuccessAlert("Registro eliminado");
            this.dataSource.data = this.dataSource.data.filter((e) => e.id !== element.id);
          } else {
            this.alertaService.showErrorAlert("Error al eliminar el registro");
          }
        },
        () => this.alertaService.showErrorAlert("Error al eliminar el registro")
      );
  }

  private async validarCantidadesAuditorias(): Promise<boolean> {
    const sinCantidad = this.dataSource.data.some(
      (auditoria) => !auditoria.cantidadAuditorias || Number(auditoria.cantidadAuditorias) === 0
    );

    if (sinCantidad) {
      await this.alertaService.showNotification(
        "Aviso",
        "Se encuentran algunas auditorías sin cantidad asignada"
      );
    }

    return true;
  }

  async guardarPaa() {
    // Validar cantidades (alerta no bloqueante)
    await this.validarCantidadesAuditorias();
    const mensajeConfirm = this.modoEditarExtraordinario
      ? "¿Está seguro(a) de guardar el Plan Anual de Auditoría actualizado por edición extraordinaria?"
      : "¿Está seguro(a) de guardar el Plan Anual de Auditoría (PAA)?";
    this.alertaService
      .showConfirmAlert(mensajeConfirm)
      .then((result) => {
        if (result.isConfirmed) {
          const auditoriaIds = this.dataSource.data.map(
            (auditoria) => auditoria.id
          );

          const payload = {
            auditorias: auditoriaIds,
          };

          // Guardar el orden de las auditorías en el plan
          this.planAnualAuditoriaService
            .put(`plan-auditoria/${this.id}`, payload)
            .subscribe({
              next: () => {
                // Tras guardar el orden exitosamente, se renderiza y persiste el PDF del PAA en Nuxeo
                this.guardarPdfPaa();
              },
              error: (error) => {
                console.error("Error al guardar el PAA:", error);
                this.alertaService.showErrorAlert(
                  "Hubo un error al guardar el Plan Anual de Auditoría"
                );
              },
            });
        }
      });
  }

  // Renderiza el PDF del PAA desde el backend y lo sube a Nuxeo.
  // Es invocado automáticamente por guardarPaa() tras persistir el orden.
  private guardarPdfPaa(): void {
    this.PlanAnualAuditoriaMid.get(`plantilla/${this.id}?auditoria-padre=true`)
      .subscribe({
        next: (res) => {
          if (res?.Data) {
            const base64 = res.Data;

            const payload = {
              IdTipoDocumento: environment.TIPO_DOCUMENTO.PLANES_AUDITORIA,
              nombre: this.id,
              descripcion: "Documento pdf, auditorias de plan de auditoria",
              metadatos: {},
              file: base64,
            };

            // Subir el PDF renderizado a Nuxeo
            this.nuxeoService.guardarArchivos([payload]).subscribe({
              next: (response: any) => {
                const documento = response[0];
                // Determinar el tipo de documento según el modo de edición:
                // - Edición extraordinaria → PLAN_ANUAL_AUDITORIA_ACTUALIZADO
                // - Flujo normal           → PLAN_ANUAL_AUDITORIA_ORIGINAL
                this.guardarReferenciaPdf(
                  documento,
                  "Plan Auditoria",
                  this.id,
                  this.modoEditarExtraordinario
                    ? environment.TIPO_DOCUMENTO_PARAMETROS.PLAN_ANUAL_AUDITORIA_ACTUALIZADO
                    : environment.TIPO_DOCUMENTO_PARAMETROS.PLAN_ANUAL_AUDITORIA_ORIGINAL
                );
              },
              error: (error) => {
                console.error("Error al subir el PDF a Nuxeo:", error);
                this.alertaService.showErrorAlert(
                  "El orden fue guardado, pero ocurrió un error al generar el documento PDF."
                );
              },
            });
          } else {
            this.alertaService.showErrorAlert(
              "El orden fue guardado, pero no se pudo renderizar el documento PDF."
            );
          }
        },
        error: (error) => {
          console.error("Error al renderizar el PDF:", error);
          this.alertaService.showErrorAlert(
            "El orden fue guardado, pero ocurrió un error al renderizar el documento PDF."
          );
        },
      });
  }

  // Registra en el sistema la referencia del documento subido a Nuxeo.
  // Es invocado por guardarPdfPaa() tras una subida exitosa a Nuxeo.
  private guardarReferenciaPdf(
    nuxeoResponse: any,
    referenciaTipo: string,
    referenciaId: string,
    tipoId: number
  ): void {
    if (nuxeoResponse?.res?.Enlace) {
      this.referenciaPdfService
        .guardarReferencia(
          nuxeoResponse.res,
          referenciaTipo,
          referenciaId,
          tipoId
        )
        .subscribe({
          next: () => {
            this.alertaService.showSuccessAlert(
              "El Plan Anual de Auditoría fue guardado exitosamente."
            );
          },
          error: (error) => {
            console.error("Error al guardar la referencia del PDF:", error);
            this.alertaService.showErrorAlert(
              "El orden fue guardado, pero ocurrió un error al registrar el documento PDF."
            );
          },
        });
    } else {
      // Si Nuxeo no devuelve enlace se notifica el éxito del guardado principal
      // y se advierte en consola para trazabilidad
      console.warn("Nuxeo no devolvió un enlace para el documento.");
      this.alertaService.showSuccessAlert(
        "El Plan Anual de Auditoría fue guardado exitosamente."
      );
    }
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
        descripcion: "Archivo para cargue masivo de auditorías",
        cargaLambda: true,
        tipo: "auditorias",
        referencia: "Plan Auditoria",
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.cargarAuditorias();
    });
  }

  subirArchivoMatriz(): void {
    this.dialog.open(CargarArchivoComponent, {
      width: "800px",
      data: {
        tipoArchivo: "pdf",
        id: this.id,
        idTipoDocumento: environment.TIPO_DOCUMENTO.MATRIZ_FUNCION_PUBLICA,
        descripcion: "Matriz función pública",
        cargaLambda: false,
        tipoIdReferencia:
          environment.TIPO_DOCUMENTO_PARAMETROS.MATRIZ_FUNCION_PUBLICA,
        referencia: "Plan Auditoria",
      },
    });
  }

  subirActaModificacion() {
    if (this.edicionExtraordinaria.length === 0) {
      this.alertaService.showNotification(
        "Edición extraordinaria",
        "No hay cambios en las auditorías para registrar en el acta de modificación.");
    } else {
      const dialogRef = this.dialog.open(CargarArchivoComponent, {
        width: "800px",
        data: {
          tipoArchivo: "pdf",
          id: this.id,
          idTipoDocumento: environment.TIPO_DOCUMENTO.ACTA_MODIFICACION,
          descripcion: "Acta de modificación de plan aprobado",
          cargaLambda: false,
          tipoIdReferencia:
            environment.TIPO_DOCUMENTO_PARAMETROS.ACTA_MODIFICACION_PLAN,
          referencia: "Plan Auditoria",
          metadatos: {
            auditoria_padre_estado_id: this.edicionExtraordinaria.map(id => id)
          },
          nuevo: true
        },
      });
      dialogRef.afterClosed().subscribe((result: boolean) => {
        if (result) this.edicionExtraordinaria = [];
      });
    }
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
        isEditExtraordinario: this.modoEditarExtraordinario,
        auditoria,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        console.log("Auditoría guardada o actualizada");
        this.cargarAuditorias();
      }
      if (result?.nuevoEstado) {
        this.edicionExtraordinaria.push(result.nuevoEstado)
      }
    });
  }

  // Editar auditoría
  async editarAuditoria(auditoria: Auditoria) {
    if (this.modoEditarExtraordinario && auditoria.id) {
      const continuar = await this.mostrarModalHijas(auditoria.id, auditoria.auditoria, 'editar');
      if (!continuar) return;
    }
    this.agregarAuditoria(auditoria);
  }

  renderizar() {
    this.PlanAnualAuditoriaMid.get(`plantilla/${this.id}?auditoria-padre=true`).subscribe(
      (res) => {
        if (res?.Data) {
          this.dialog.open(ModalPdfVisualizadorComponent, {
            data: {
              base64Document: res.Data,
              id: this.id,
              vigenciaNombre: this.vigenciaNombre,
              actualizado: this.modoEditarExtraordinario
            },
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
    if (this.edicionExtraordinaria.length > 0) {
      this.alertaService.showErrorAlert(
        "No ha subido un Acta de Modificación Extraordinaria."
      );
    } else {
      this.router.navigate([`/programacion/plan-auditoria`]);
    }
  }

  verDocumentos() {
    this.documentoUtils.verDocumentos(this.id, this.estadoIdActual ?? 0, this.vigenciaNombre, this.roles);
  }

  buscarMatriz(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.planAnualAuditoriaService.get(`documento?query=referencia_id:${this.id},referencia_tipo:Plan Auditoria,tipo_id:${environment.TIPO_DOCUMENTO_PARAMETROS.MATRIZ_FUNCION_PUBLICA},activo:true&fields=nuxeo_enlace`)
        .subscribe(
          (res) => {
            if (res?.Data?.length > 0) {
              resolve(res.Data[0].nuxeo_enlace); // Tomar el primer valor
            } else {
              resolve(null);
            }
          },
          (error: Error) => {
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

  eliminarAuditorias(): void {
    this.alertaService
      .showConfirmAlert("¿Está seguro(a) de eliminar todas las auditorías del PAA? Esta acción no se puede deshacer.")
      .then((result) => {
        if (result.isConfirmed) {
          const payload = {
            usuario_id: this.usuario_id,
            usuario_rol: [environment.ROL.AUDITOR_EXPERTO, environment.ROL.AUDITOR, environment.ROL.AUDITOR_ASISTENTE].find(rol => this.rolService.tieneRol(rol)),
            observacion: 'Eliminación masiva de auditorías',
            estado_id: environment.AUDITORIA_PADRE_ESTADO.ELIMINADA_ID,
            fase_id: null,
          };

          this.planAnualAuditoriaService
            .deleteWithBody(`auditoria-gestion/${this.id}/auditoria-padre-borrador`, payload)
            .subscribe(
              (response) => {
                console.log('Respuesta del servidor:', response);
                this.alertaService.showSuccessAlert("Auditorías eliminadas exitosamente");
                this.dataSource.data = [];
              },
              (error) => {
                console.error('Error al eliminar auditorías:', error);
                this.alertaService.showErrorAlert("Error al eliminar las auditorías");
              }
            );
        }
      });
  }

}
