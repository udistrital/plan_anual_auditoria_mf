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
import { ModalVerDocumentoComponent } from "src/app/shared/elements/components/dialogs/modal-ver-documento/modal-ver-documento.component";
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
import { ModalVerDocumentosComponent } from "src/app/shared/elements/components/dialogs/modal-ver-documentos/modal-ver-documentos.component";
import { forkJoin } from "rxjs";

@Component({
  selector: "app-tabla-seguimiento",
  templateUrl: "./tabla-seguimiento.component.html",
  styleUrl: "./tabla-seguimiento.component.css",
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
  ]);
  tipoDocumentoParametros = environment.TIPO_DOCUMENTO_PARAMETROS;

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
  ) {}

  ngOnInit() {
    this.roles = this.rolService.getRoles();
    this.setPermisos();
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
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
    offset: number = 0
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

        if (!(auditorias.length > 0)) {
          this.banderaTablaSeguimiento = false;
          this.auditoriasDataSource.data = [];
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

    const cargoId = this.rolService.tieneRol(environment.ROL.JEFE_DEPENDENCIA)
      ? environment.CARGO.JEFE_DEPENDENCIA_ID
      : this.rolService.tieneRol(environment.ROL.ASISTENTE_DEPENDENCIA)
        ? environment.CARGO.ASISTENTE_DEPENDENCIA_ID
        : 0;

    return `${endpoint}${this.usuarioId}/${cargoId}?${queryParams}`;
  }

  construirTabla() {
    this.auditoriasContructorTabla = colocacionesContructorTabla.filter(
      (column) => {
        return column.columnDef !== "acciones" || this.mostrarAcciones;
      }
    );
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
        this.roles.flatMap((rol) => accionesPlaneacion[rol]?.[estado] || [])
      )
    );
  }

  // Obtener el icono dependiendo de la acción
  getIconoAccion(accion: string): string {
    return this.iconosAccion.get(accion) ?? "help";
  }

  // Acciones
  realizarAccion(auditoria: any, accion: string) {
    const acciones: Record<string, Function | null> = {
      "Ver Documentos": () => this.verDocumentos(auditoria),
      "Ver Auditoría": () => this.verAuditoria(auditoria),
      "Editar Auditoría": () => this.editarAuditoria(auditoria),
      "Revisar Auditoría": () => this.revisarAuditoria(auditoria),
      "Enviar a Aprobación por Jefe": () =>
        this.preguntarEnvioAprobacionPorJefe(auditoria),
    };
    acciones[accion]?.();
  }

  verDocumento(auditoria: Auditoria) {
    const auditoriaId = auditoria._id;
    this.planAuditoriaMid
      .get(`plantilla/plan-trabajo/${auditoriaId}`)
      .subscribe((res) => {
        const documentoBase64 = res.Data;
        const dialogRef = this.dialog.open(ModalVerDocumentoComponent, {
          width: "1000px",
          data: documentoBase64,
          autoFocus: false,
        });

        const modalInstance = dialogRef.componentInstance;
        modalInstance.botonGuardar = {
          icono: "save",
          texto: "Guardar documento",
        };

        dialogRef.afterClosed().subscribe((res) => {
          if (!res) return;

          if (res.accion === "guardarDocumento") {
            this.guardarDocumento(documentoBase64, auditoria);
          }
        });
      });
  }

  verAuditoria(auditoria: Auditoria) {
    // TODO: Implement the view functionality
    console.log("Ver auditoría:", auditoria);
    this.alertService.showSuccessAlert(
      "Funcionalidad en desarrollo",
      "La funcionalidad de ver auditoría está en desarrollo."
    );
  }

  editarAuditoria(auditoria: Auditoria) {
    const auditoriaId = auditoria._id;
    this.router.navigate([
      `/planeacion/seguimiento/editar/${auditoriaId}`,
    ]);
  }

  revisarAuditoria(auditoria: Auditoria) {
    const auditoriaId = auditoria._id;
    const tipoEvaluacionId = auditoria.tipo_evaluacion_id;

    let route = `planeacion/seguimiento/revision/${auditoriaId}`;
    this.router.navigate([route], { queryParams: { tipoEvaluacionId } });
  }

  preguntarEnvioAprobacionPorJefe(auditoria: Auditoria) {
    this.alertService
      .showConfirmAlert("¿Está seguro(a) de enviar a aprobación por Jefe?")
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }
        this.validarDocumentosAnexados(auditoria._id);
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

  enviarAprobacionPorJefe(auditoriaId: string) {
    const auditoriaEstado = {
      auditoria_id: auditoriaId,
      usuario_id: this.usuarioId,
      usuario_rol: [environment.ROL.AUDITOR_EXPERTO, environment.ROL.AUDITOR, environment.ROL.AUDITOR_ASISTENTE].find(rol => this.rolService.tieneRol(rol)),
      observacion: "",
      estado_id: this.auditoriaEstados.PLANEACION.REVISION_PROGRAMA_JEFE,
      fase_id: environment.AUDITORIA_FASE.PLANEACION,
    };
    this.planAuditoriaService
      .post("auditoria-estado", auditoriaEstado)
      .subscribe({
        next: () => {
          this.alertService.showSuccessAlert(
            "Auditoría enviada a aprobación por Jefe",
            "Auditoría enviada"
          );
        },
        error: () => {
          this.alertService.showErrorAlert("Error al enviar el plan.");
        }
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

  validarDocumentosAnexados(auditoriaId: any) {
    const docs = [
      { tipo: this.tipoDocumentoParametros.SOLICITUD_INFORMACION, nombre: "solicitud de información"},
      { tipo: this.tipoDocumentoParametros.COMPROMISO_ETICO, nombre: 'compromiso ético' }
    ];

    const requests = docs.map(d =>
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
        this.enviarAprobacionPorJefe(auditoriaId);
      },
      error: (error) => {
        console.error(error);
        this.alertService.showErrorAlert("Error validando los documentos.");
      }
    });
  }
}
