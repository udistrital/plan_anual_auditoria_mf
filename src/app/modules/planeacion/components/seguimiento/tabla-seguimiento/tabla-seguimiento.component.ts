import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { colocacionesContructorTabla } from "./tabla-seguimiento.utilidades";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { MatDialog } from "@angular/material/dialog";
import { ModalHistorialRechazosComponent } from "src/app/shared/elements/components/dialogs/modal-historial-rechazos/modal-historial-rechazos.component";
import { Router } from "@angular/router";
import { Auditoria } from "src/app/shared/data/models/auditoria";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { UserService } from "src/app/core/services/user.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { RolService } from "src/app/core/services/rol.service";
import { accionesPlaneacion } from "src/app/shared/utils/accionesPorRolYEstado";
import emojiColorPorPrefijoEstado from "src/app/shared/utils/colorPorPrefijoEstado";
import { ModalVerDocumentosComponent } from "src/app/shared/elements/components/dialogs/modal-ver-documentos/modal-ver-documentos.component";
import { TercerosService } from "src/app/shared/services/terceros.service";
import { NotificacionesService, DestinatariosEmail, VariablesSolicitud } from "src/app/shared/services/notificaciones.service";
import { NotificacionRegistroCrudService } from "src/app/core/services/notificacion-registro-crud.service";
import { PLANTILLA_SOLICITUD_NOMBRE } from "src/app/core/services/notificaciones-mid.service";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { ModalEnviarAprobacionComponent } from "src/app/shared/elements/components/dialogs/modal-enviar-aprobacion/modal-enviar-aprobacion.component";
import { forkJoin, of, throwError } from "rxjs";
import { catchError, exhaustMap, tap } from "rxjs/operators";

@Component({
    selector: "app-tabla-seguimiento",
    templateUrl: "./tabla-seguimiento.component.html",
    styleUrl: "./tabla-seguimiento.component.css",
    standalone: false
})
export class TablaSeguimientoComponent implements OnInit {
  @Input() vigenciaId: any;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  auditoriasDataSource: MatTableDataSource<any> = new MatTableDataSource();
  auditoriaEstados = environment.AUDITORIA_ESTADO;
  auditoriasPorVigencia: Auditoria[] = [];
  auditoriasContructorTabla: any;
  banderaTablaSeguimiento: boolean = false;
  tablaColumnas: any;
  roles: string[] = [];
  usuarioId: any;
  totalRegistros: number = 0;
  pageSize: number = 5;
  pageIndex: number = 0;
  itemsPerPage: number[] = [5, 10, 20];
  mostrarAcciones: boolean = false;
  iconosAccion = new Map<string, string>([
    ["Ver Documento", "description"],
    ["Ver Documentos", "description"],
    ["Ver Auditoría", "visibility"],
    ["Editar Auditoría", "edit"],
    ["Revisar Auditoría", "content_paste_search"],
    ["Enviar a Aprobación por Jefe", "send"],
    ["Iniciar Ejecución", "play_arrow"],
    ["Historial de Observaciones", "report"]
  ]);
  tipoDocumentoParametros = environment.TIPO_DOCUMENTO_PARAMETROS;
  
  // Filtros de la vista (estado, consecutivo)
   private readonly rolesConFiltros = [
    environment.ROL.JEFE,
    environment.ROL.AUDITOR_EXPERTO,
    environment.ROL.AUDITOR,
    environment.ROL.AUDITOR_ASISTENTE,
  ];

  get mostrarFiltros(): boolean {
    return this.rolesConFiltros.some((rol) =>
      this.rolService.tieneRol(rol)
    );
  }
  filtroEstado: number | null = null;
  filtroConsecutivo: string = "";
  estadoOptions: Array<{ id: number; nombre: string }> = [];

  constructor(
    private readonly alertService: AlertService,
    private readonly rolService: RolService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly dialog: MatDialog,
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly nuxeoService: NuxeoService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly router: Router,
    private readonly userService: UserService,
    private readonly tercerosService: TercerosService,
    private readonly notificacionesService: NotificacionesService,
    private readonly notificacionRegistroCrudService: NotificacionRegistroCrudService,
    private readonly parametrosUtilsService: ParametrosUtilsService,
  ) {}

  ngOnInit() {
    this.roles = this.rolService.getRoles();
    this.setPermisos();
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
    });
    if (this.mostrarFiltros) {
      this.buildEstadoOptions();
    }
  }


  private buildEstadoOptions(): void {
    this.parametrosUtilsService
      .getEstadosAuditoria(7060, 7080)
      .subscribe({
        next: (estados) => {
          this.estadoOptions = estados.map((estado) => ({
            id: estado.Id,
            nombre: estado.Nombre,
          }));
        },

        error: (error) => {
          console.error(error);

          this.alertService.showErrorAlert(
            "No fue posible cargar los estados de auditoría."
          );

          this.estadoOptions = [];
        },
      });
  }

  setPermisos() {
    if (this.rolService.mostrarAcciones(accionesPlaneacion)) {
      this.mostrarAcciones = true;
    }
  }

  async listarAuditoriasPorVigencia(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0,
    _retry: boolean = false
  ) {
    let url;
    if (this.rolService.tieneRol(environment.ROL.AUDITOR) || this.rolService.tieneRol(environment.ROL.AUDITOR_ASISTENTE)) {
      url = this.urlAuditoriasPorVigenciaFiltroAuditor(vigenciaId, limit, offset);
    }
    else if (this.rolService.tieneRol(environment.ROL.JEFE_DEPENDENCIA) || this.rolService.tieneRol(environment.ROL.ASISTENTE_DEPENDENCIA)) {
      url = this.urlAuditoriasPorVigenciaFiltroAuditado(vigenciaId, limit, offset);
    } else {
      url = this.urlAuditoriasPorVigenciaTodas(vigenciaId, limit, offset);
    }

    // Insertar filtros adicionales dentro del parámetro `query` (antes de &limit)
    let filterSuffix = '';
    if (this.filtroEstado) {
      filterSuffix += `,estado_id:${this.filtroEstado}`;
    }
    if (this.filtroConsecutivo && this.filtroConsecutivo.trim() !== '') {
      const c = this.filtroConsecutivo.trim();
      filterSuffix += `,consecutivo_OCI__icontains:${c}`;
    }

    if (filterSuffix && url) {
      const idx = url.indexOf('&limit=');
      if (idx !== -1) {
        url = url.slice(0, idx) + filterSuffix + url.slice(idx);
      } else {
        url = url + filterSuffix;
      }
    }

    if (!url)
      return;

    this.auditoriasPorVigencia = [];
    this.planAuditoriaMid
      .get(url)
      .subscribe((res) => {
        const auditorias: any[] = res.Data.map((auditoria: any) => {
          const estadoId = auditoria.estado?.estado_id;
          const acciones = this.getAccionesPorRolYEstado(estadoId);
          return { ...auditoria, acciones };
        });

        if (auditorias.length === 0) {
          this.banderaTablaSeguimiento = false;
          this.auditoriasDataSource.data = [];

          // Detectar si la búsqueda tenía filtros activos
          const huboFiltroEstado = !!this.filtroEstado;
          const huboFiltroConsecutivo = !!(this.filtroConsecutivo && this.filtroConsecutivo.trim() !== "");
          const huboFiltrosActivos = huboFiltroEstado || huboFiltroConsecutivo;

          if (huboFiltrosActivos && !_retry) {
            this.alertService.showAlert(
              "No se encontraron auditorías",
              "No se encontraron auditorías con los filtros aplicados. Se mostrará la lista completa para la vigencia."
            );

            // limpiar filtros y reintentar una vez
            this.filtroEstado = null;
            this.filtroConsecutivo = "";
            setTimeout(() => this.listarAuditoriasPorVigencia(vigenciaId, limit, offset, true), 200);
            return;
          }

          return this.alertService.showAlert(
            "No hay auditorías registradas",
            "Actualmente no hay auditorías registradas para la vigencia seleccionada."
          );
        }

        this.auditoriasPorVigencia = auditorias;

        this.totalRegistros = res.MetaData.Count;
        this.banderaTablaSeguimiento = true;
        this.construirTabla();
      });
  }

  /**
   * Constructs the URL to fetch audits of type seguimiento and informe for a given vigencia.
   * @param vigenciaId The ID of the vigencia.
   * @param limit The maximum number of records to return.
   * @param offset The number of records to skip.
   * @returns The constructed URL string.
   */
  urlAuditoriasPorVigenciaTodas(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0
  ): string {
    let endpoint = "auditoria";

    // Construct the query to fetch audits of type seguimiento and informe for the given vigencia
    const seguimiento_id = environment.TIPO_EVALUACION.SEGUIMIENTO_ID;
    const informe_id = environment.TIPO_EVALUACION.INFORME_ID;
    let queryParams = `query=vigencia_id:${vigenciaId}`;
    queryParams += `,estado_id__gte:${environment.AUDITORIA_ESTADO.PROGRAMACION.AUDITOR_ASIGNADO}`;
    queryParams += `,tipo_evaluacion_id__in:${seguimiento_id}|${informe_id}`;
    queryParams += `,activo:true`;

    // Add pagination parameters
    queryParams += `&limit=${limit}`
    queryParams += `&offset=${offset}`;

    return `${endpoint}?${queryParams}`;
  }

  /**
   * Constructs the URL to fetch audits for a given vigencia filtered by the authenticated auditor.
   * @param vigenciaId The ID of the vigencia.
   * @param limit The maximum number of records to return.
   * @param offset The number of records to skip.
   * @returns The constructed URL string.
   */
  urlAuditoriasPorVigenciaFiltroAuditor(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0
  ): string {
    const endpoint = "auditoria/auditor/" + this.usuarioId;

    const seguimiento_id = environment.TIPO_EVALUACION.SEGUIMIENTO_ID;
    const informe_id = environment.TIPO_EVALUACION.INFORME_ID;
    let queryParams = `query=vigencia_id:${vigenciaId}`;
    queryParams += `,tipo_evaluacion_id__in:${seguimiento_id}|${informe_id}`;
    queryParams += `,activo:true`;

    // Add pagination parameters
    queryParams += `&limit=${limit}`
    queryParams += `&offset=${offset}`;

    return `${endpoint}?${queryParams}`;
  }

  /**
   * Constructs the URL to fetch audits of type seguimiento and informe for a given vigencia for the audited user.
   * @param vigenciaId The ID of the vigencia.
   * @param limit The maximum number of records to return.
   * @param offset The number of records to skip.
   * @returns The constructed URL string.
   */
  urlAuditoriasPorVigenciaFiltroAuditado(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0
  ) {
    const endpoint = `auditoria/auditado/`
    const seguimiento_id = environment.TIPO_EVALUACION.SEGUIMIENTO_ID;
    const informe_id = environment.TIPO_EVALUACION.INFORME_ID;
    let queryParams = `query=vigencia_id:${vigenciaId}`;
    queryParams += `,estado_id__gte:${environment.AUDITORIA_ESTADO.PLANEACION.APROBADO_PROGRAMA_JEFE}`
    queryParams += `,tipo_evaluacion_id__in:${seguimiento_id}|${informe_id}`;
    queryParams += `,activo:true`;
    queryParams += `&limit=${limit}`
    queryParams += `&offset=${offset}`;

    let cargoId = 0;

    if (this.rolService.tieneRol(environment.ROL.JEFE_DEPENDENCIA)) {
      cargoId = environment.CARGO.JEFE_DEPENDENCIA_ID;
    } else if (this.rolService.tieneRol(environment.ROL.ASISTENTE_DEPENDENCIA)) {
      cargoId = environment.CARGO.ASISTENTE_DEPENDENCIA_ID;
    }

    return `${endpoint}${this.usuarioId}/${cargoId}?${queryParams}`;
  }

  construirTabla() {
    this.auditoriasContructorTabla = colocacionesContructorTabla.filter(
      (column) => {
        return column.columnDef !== "acciones" || this.mostrarAcciones;
      }
    );
    // // Asegurar columna de consecutivo_OCI visible
    // const existeConsecutivo = this.auditoriasContructorTabla.some((c: any) => c.columnDef === 'consecutivo_oci');
    // if (!existeConsecutivo) {
    //   this.auditoriasContructorTabla.unshift({
    //     columnDef: 'consecutivo_oci',
    //     header: 'Consecutivo OCI',
    //     sortable: false,
    //     cell: (row: any) => row.consecutivo_OCI ?? ''
    //   });
    // }
    this.tablaColumnas = this.auditoriasContructorTabla.map(
      (column: any) => column.columnDef
    );

    this.auditoriasDataSource = new MatTableDataSource(
      this.auditoriasPorVigencia
    );

    //si no hay paginador, se crea
    if (!this.paginator) {
      this.auditoriasDataSource.paginator = this.paginator;
      this.auditoriasDataSource.sort = this.sort;
    }

    this.changeDetector.detectChanges();
  }

  manejarCambioPaginado(evento: PageEvent) {
    // Actualizar el índice de página y tamaño de página
    this.pageSize = evento.pageSize;
    this.pageIndex = evento.pageIndex;

    const offset = this.pageIndex * this.pageSize;
    this.listarAuditoriasPorVigencia(this.vigenciaId, this.pageSize, offset);
    // Actualizar el paginador después de realizar la consulta
    this.paginator.length = this.totalRegistros;
    this.paginator.pageSize = this.pageSize;
    this.paginator.pageIndex = this.pageIndex;
  }

  // Usar un conjunto para evitar duplicados en las acciones
  getAccionesPorRolYEstado(estado: number) {
    return Array.from(
      new Set(
        this.roles.flatMap((rol) => accionesPlaneacion[rol]?.[estado] ?? [])
      )
    );
  }

  // Obtener el icono dependiendo de la acción
  getIconoAccion(accion: string): string {
    return this.iconosAccion.get(accion) ?? "help";
  }

  escogerEmojiColorEstado(estado: string): string {
    for (const prefijo in emojiColorPorPrefijoEstado) {
      if (estado?.startsWith(prefijo)) {
        return emojiColorPorPrefijoEstado[prefijo];
      }
    }
    return "⚪";
  }

  getEstadoConColor(auditoria: any): string {
    const estado = auditoria.estado_nombre ?? "Sin estado";
    return `${this.escogerEmojiColorEstado(estado)} ${estado}`;
  }

  // Acciones
  realizarAccion(auditoria: any, accion: string) {
    const acciones: Record<string, Function | null> = {
      "Ver Documentos": () => this.verDocumentos(auditoria),
      "Ver Auditoría": () => this.verAuditoria(auditoria),
      "Editar Auditoría": () => this.editarAuditoria(auditoria),
      "Revisar Auditoría": () => this.revisarAuditoria(auditoria),
      "Enviar a Aprobación por Jefe": () => this.preguntarEnvioAprobacionPorJefe(auditoria),
      "Iniciar Ejecución": () => this.iniciarEjecucion(auditoria),
      "Historial de Observaciones": () => this.abrirHistorialRechazos(auditoria),
    };
    acciones[accion]?.();
  }

  verAuditoria(auditoria: Auditoria) {
    const auditoriaId = auditoria._id;
    this.router.navigate([
      `/planeacion/seguimiento/editar/${auditoriaId}`,
    ], {
      queryParams: { modo: "ver" },
    });
  }

  editarAuditoria(auditoria: Auditoria) {
    const auditoriaId = auditoria._id;
    this.router.navigate([
      `/planeacion/seguimiento/editar/${auditoriaId}`,
    ]);
  }

  abrirHistorialRechazos(auditoria: Auditoria) {
    this.dialog.open(ModalHistorialRechazosComponent, {
      width: "1000px",
      data: {
        auditoriaId: auditoria._id,
        estadoIds: [environment.AUDITORIA_ESTADO.PLANEACION.RECHAZADO_PROGRAMA_JEFE],
        titulo: "Motivos de rechazo y observaciones",
        descripcion: `Lista de motivos de rechazo y observaciones - Auditoría ${auditoria.titulo}`,
      },
    });
  }

  revisarAuditoria(auditoria: Auditoria) {
    const auditoriaId = auditoria._id;
    const tipoEvaluacionId = auditoria.tipo_evaluacion_id;

    let route = `planeacion/seguimiento/revision/${auditoriaId}`;
    this.router.navigate([route], { queryParams: { tipoEvaluacionId } });
  }

  iniciarEjecucion(auditoria: Auditoria) {
    this.alertService
      .showConfirmAlert("¿Está seguro(a) de iniciar la ejecución de esta auditoría?")
      .then((confirmado) => {
        if (!confirmado.value) return;

        const esSeguimiento = auditoria.tipo_evaluacion_id === environment.TIPO_EVALUACION.SEGUIMIENTO_ID;

        const payload = {
          auditoria_id: auditoria._id,
          usuario_id: this.usuarioId,
          usuario_rol: [environment.ROL.JEFE, environment.ROL.ADMIN].find(rol => this.rolService.tieneRol(rol)),
          observacion: "",
          estado_id: environment.AUDITORIA_ESTADO.EJECUCION.POR_EJECUTAR,
          fase_id: esSeguimiento ? environment.AUDITORIA_FASE.EJECUCION_FINAL : environment.AUDITORIA_FASE.EJECUCION_PRELIMINAR,
        };

        this.planAuditoriaService.post("auditoria-estado", payload).subscribe({
          next: () => {
            this.alertService.showSuccessAlert("Ejecución iniciada correctamente", "Ejecución iniciada");
            this.listarAuditoriasPorVigencia(this.vigenciaId, this.pageSize, this.pageIndex * this.pageSize);
          },
          error: () => this.alertService.showErrorAlert("Error al iniciar la ejecución."),
        });
      });
  }

  preguntarEnvioAprobacionPorJefe(auditoria: Auditoria) {
    const dialogRef = this.dialog.open(ModalEnviarAprobacionComponent, {
      width: '500px',
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((observacion: string | null) => {
      if (observacion === null || observacion === undefined) {
        return;
      }
      this.validarDocumentosAnexados(auditoria._id, observacion);
    });
  }

  guardarDocumento(documentoBase64: any, auditoria: any) {
    if (documentoBase64 !== "") {
      const payload = {
        IdTipoDocumento: environment.TIPO_DOCUMENTO.PROGRAMA_TRABAJO_AUDITORIA,
        nombre: "Programa de trabajo",
        descripcion:
          "Documento pdf (Programa de trabajo) de auditoría de plan de auditoría",
        metadatos: {},
        file: documentoBase64,
      };

      this.nuxeoService.guardarArchivos([payload]).subscribe({
        next: (response: any) => {
          const documentoRefNuxeo = response[0];
          this.guardarReferencia(
            documentoRefNuxeo,
            "Auditoria",
            auditoria._id,
            environment.TIPO_DOCUMENTO_PARAMETROS.PROGRAMA_TRABAJO
          );
        },
        error: (error) => {
          console.error("Error al subir el documento", error);
        },
      });
    }
  }

  guardarReferencia(
    nuxeoResponse: any,
    referencia_tipo: string,
    referencia_id: string,
    tipo_id: number
  ): void {
    if (nuxeoResponse.res.Enlace) {
      this.referenciaPdfService
        .guardarReferencia(
          nuxeoResponse.res,
          referencia_tipo,
          referencia_id,
          tipo_id
        )
        .subscribe({
          next: (response) => {
            this.alertService.showSuccessAlert("Archivo subido exitosamente.");
          },
          error: (error) => {
            console.error("Error al guardar la referencia", error);
          },
        });
    }
  }

  enviarAprobacionPorJefe(auditoriaId: string, observacion: string = "") {
    const auditoriaEstado = {
      auditoria_id: auditoriaId,
      usuario_id: this.usuarioId,
      usuario_rol: [environment.ROL.AUDITOR_EXPERTO, environment.ROL.AUDITOR, environment.ROL.AUDITOR_ASISTENTE].find(rol => this.rolService.tieneRol(rol)),
      observacion,
      estado_id: this.auditoriaEstados.PLANEACION.REVISION_PROGRAMA_JEFE,
      fase_id: environment.AUDITORIA_FASE.PLANEACION,
    };

    this.planAuditoriaService
      .post("auditoria-estado", auditoriaEstado)
      .subscribe({
        next: () => {
          this.alertService.showSuccessAlert(
            "Auditoría enviada a revisión del programa por Jefe",
            "Auditoría enviada"
          );
          this.notificarEnvioAJefe(auditoriaId);
          this.listarAuditoriasPorVigencia(this.vigenciaId, this.pageSize, this.pageIndex * this.pageSize);
        },
        error: (error) => {
          this.alertService.showErrorAlert("Error al enviar el programa.");
        }
    });
  }

    /**
   * Notifica al Jefe OCI cuando un auditor envía el programa de auditoría a revisión.
   * Patrón: getAuthenticatedUserTerceroIdentification() primero y sola,
   * luego forkJoin con auditoria.
   */
  
  private notificarEnvioAJefe(auditoriaId: string): void {
    const rolRemitente = [
      environment.ROL.AUDITOR_EXPERTO,
      environment.ROL.AUDITOR,
      environment.ROL.AUDITOR_ASISTENTE,
    ].find(rol => this.rolService.tieneRol(rol)) ?? "Auditor";

    this.tercerosService.getAuthenticatedUserTerceroIdentification().pipe(

      exhaustMap((tercero) =>
        forkJoin({
          auditoria: this.planAuditoriaService.get(`auditoria/${auditoriaId}`),
          vigencias: this.parametrosUtilsService.getVigencias(),
          nombreRemitente: of(tercero.NombreCompleto),
          jefeOCI: this.tercerosService.getJefeOCI(),
        })
      ),

      exhaustMap(({ auditoria, vigencias, nombreRemitente, jefeOCI }: any) => {
        const datosAuditoria: Auditoria = auditoria?.Data;

        const vigenciaId = datosAuditoria?.vigencia_id;
        const vigenciaObj = vigencias.find((v: any) => v.Id === vigenciaId);
        const vigenciaNombre = vigenciaObj?.Nombre || (vigenciaId ? String(vigenciaId) : "");

        const destinatarios: DestinatariosEmail = this.tercerosService.combinarDestinatarios(
          [jefeOCI.UsuarioWSO2],
          environment.NOTIFICACION_PROGRAMA_TRABAJO_ENVIO_JEFE_DESTINATARIOS
        );

        const variablesSolicitud: VariablesSolicitud = {
          titulo_solicitud: "Revisión de Programa de Auditoría",
          tipo_solicitud: "revisión y aprobación",
          nombre_documento: `Programa de Auditoría${datosAuditoria?.titulo ? ' - ' + datosAuditoria.titulo : ''}`,
          vigencia: vigenciaNombre,
          rol_remitente: rolRemitente,
          nombre_remitente: nombreRemitente || rolRemitente,
          fecha_envio: new Date().toLocaleDateString(),
        };

        return this.notificacionesService.enviarNotificacionSolicitud(
          destinatarios,
          variablesSolicitud
        ).pipe(
          tap((response: any) => {
            if (response?.Status == 200) {
              this.registrarNotificacion(
                auditoriaId,
                destinatarios,
                variablesSolicitud,
                "envio_revision_jefe_programa_trabajo"
              );
            }
          })
        );
      }),

      catchError((error) => {
        console.warn("Error al enviar notificación al Jefe OCI:", error);
        return throwError(() => error);
      })

    ).subscribe({
      error: (err) => console.warn("Error en notificación envío a Jefe:", err),
    });
  }

  private registrarNotificacion(
    auditoriaId: string,
    destinatarios: DestinatariosEmail,
    variables: VariablesSolicitud,
    tipoNotificacion: string,
    template: string = PLANTILLA_SOLICITUD_NOMBRE,
  ): void {
    const payload = {
      plantilla: template,
      fecha_envio: new Date(),
      metadato: {
        ...variables,
        tipo_notificacion: tipoNotificacion,
        destinatarios_to: destinatarios.ToAddresses ?? [],
        destinatarios_cc: destinatarios.CcAddresses ?? [],
        destinatarios_bcc: destinatarios.BccAddresses ?? [],
      },
      referencia_id: auditoriaId,
      referencia_tipo: 'AUDITORIA INTERNA',
    };

    this.notificacionRegistroCrudService.post(payload).subscribe({
      next: (res) => console.debug("Registro de notificación guardado:", res),
      error: (err) => console.warn("Error guardando registro de notificación:", err),
    });
  }

  /**
   * Shows the Solicitud de Información document for the given auditoria in a modal.
   * @param auditoria The auditoria whose document is to be viewed.
   */
  verDocumentos(auditoria: any) {
    const auditoriaId = auditoria._id;
    this.dialog.open(ModalVerDocumentosComponent, {
      width: "1200px",
      data: {
        entityId: auditoriaId,
        descripcion: "Documentos de la Auditoría de Seguimiento",
        sufijo: `oci-${auditoria.consecutivo_OCI}`,
        tabs: [
          {
            nombre: "Oficio Anuncio Solicitud de Información",
            tipoId: environment.TIPO_DOCUMENTO_PARAMETROS.SOLICITUD_INFORMACION
          },
          {
            nombre: "Compromiso Ético",
            tipoId: environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO
          }
        ]
      },
    });
  }

  validarDocumentosAnexados(auditoriaId: any, observacion: string = "") {
    const docs = [
      { tipo: this.tipoDocumentoParametros.SOLICITUD_INFORMACION, nombre: "solicitud de información" },
      { tipo: this.tipoDocumentoParametros.COMPROMISO_ETICO, nombre: 'compromiso ético' },
    ];

    const requests = docs.map((d) =>
      this.planAuditoriaService.get(
        `documento?query=referencia_id:${auditoriaId},tipo_id:${d.tipo},activo:true`
      )
    );

    forkJoin(requests).subscribe({
      next: (responses) => {
        for (let i = 0; i < responses.length; i++) {
          if (!responses[i] || responses[i].Data.length === 0) {
            this.alertService.showErrorAlert(
              `No se ha encontrado el documento de  ${docs[i].nombre}. Por favor, asegúrese de subir todos los documentos requeridos antes de enviar a aprobación por Jefe.`
            );
            return;
          }
        }
        this.enviarAprobacionPorJefe(auditoriaId, observacion);
      },
      error: (error) => {
        console.error(error);
        this.alertService.showErrorAlert("Error validando los documentos.");
      },
    });
  }
}
