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
import { colocacionesContructorTabla } from "./tabla-auditorias-internas.utilidades";
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
import { forkJoin, of, throwError } from "rxjs";
import { catchError, exhaustMap, tap } from "rxjs/operators";
import { ModalVerDocumentosComponent } from "src/app/shared/elements/components/dialogs/modal-ver-documentos/modal-ver-documentos.component";
import { TercerosService } from "src/app/shared/services/terceros.service";
import {
  NotificacionesService,
  DestinatariosEmail,
  VariablesSolicitud,
} from "src/app/shared/services/notificaciones.service";
import { NotificacionRegistroCrudService } from "src/app/core/services/notificacion-registro-crud.service";
import { PLANTILLA_SOLICITUD_NOMBRE } from "src/app/core/services/notificaciones-mid.service";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";

@Component({
  selector: "app-tabla-auditorias-internas",
  templateUrl: "./tabla-auditorias-internas.component.html",
  styleUrl: "./tabla-auditorias-internas.component.css",
})
export class TablaAuditoriasInternasComponent implements OnInit {
  @Input() vigenciaId: any;
  @Input() role: any;
  @Input() personaId: any;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  auditoriasDataSource: MatTableDataSource<any> = new MatTableDataSource();
  auditoriaEstados = environment.AUDITORIA_ESTADO;
  auditoriasPorVigencia: Auditoria[] = [];
  auditoriasContructorTabla: any;
  banderaTablaAuditoriasInternas: boolean = false;
  tablaColumnas: any;
  roles: string[] = [];
  usuarioId: any;
  totalRegistros: number = 0;
  pageSize: number = 5;
  pageIndex: number = 0;
  itemsPerPage: number[] = [5, 10, 20];
  mostrarAcciones: boolean = false;
  tipoConsulta: 'general' | 'auditado' | 'jefe_OCI' = 'general';
  cargoId: number = 0;
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
    this.configurarTipoConsulta();
  }

  setPermisos() {
    if (this.rolService.mostrarAcciones(accionesPlaneacion)) {
      this.mostrarAcciones = true;
    }
  }

  private async configurarTipoConsulta() {
    if (this.rolService.tieneRol(environment.ROL.JEFE_DEPENDENCIA)) {
      this.tipoConsulta = 'auditado';
      this.cargoId = environment.CARGO.JEFE_DEPENDENCIA_ID;
      this.personaId = await this.userService.getPersonaId();
    } else if (this.rolService.tieneRol(environment.ROL.ASISTENTE_DEPENDENCIA)) {
      this.tipoConsulta = 'auditado';
      this.cargoId = environment.CARGO.ASISTENTE_DEPENDENCIA_ID;
      this.personaId = await this.userService.getPersonaId();
    } else if (this.rolService.tieneRol(environment.ROL.JEFE)) {
      this.tipoConsulta = 'jefe_OCI';
      this.personaId = await this.userService.getPersonaId();
    }
  }

  listarAuditoriasPorVigencia(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0,
    estadoId?: number
  ) {
    this.auditoriasPorVigencia = [];

    let query = `vigencia_id:${vigenciaId},activo:true,tipo_evaluacion_id:${environment.TIPO_EVALUACION.AUDITORIA_INTERNA_ID}`;
    let endpoint = "";

    switch (this.tipoConsulta) {
      case 'auditado':
        query += `,estado_id:${environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO}`;
        endpoint = `auditoria/auditado/${this.personaId}/${this.cargoId}?query=${query}&limit=${limit}&offset=${offset}`;
        break;
      case 'jefe_OCI':
        query += `,estado_id:${environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE}`;
        endpoint = [environment.ROL.AUDITOR, environment.ROL.AUDITOR_ASISTENTE].includes(this.role) && this.personaId
            ? `auditoria/auditor/${this.personaId}?query=${query}&limit=${limit}&offset=${offset}${estadoId ? `&estado_id=${estadoId}` : ''}`
            : `auditoria?query=${query}&limit=${limit}&offset=${offset}`;
        break;
      default:
        if (estadoId) {
          query += `,estado_id:${estadoId}`;
        }
          endpoint = [environment.ROL.AUDITOR, environment.ROL.AUDITOR_ASISTENTE].includes(this.role) && this.personaId
            ? `auditoria/auditor/${this.personaId}?query=${query}&limit=${limit}&offset=${offset}${estadoId ? `&estado_id=${estadoId}` : ''}`
            : `auditoria?query=${query}&limit=${limit}&offset=${offset}`;
    }

    this.planAuditoriaMid
      .get(endpoint)
      .subscribe((res) => {
        const auditorias: any[] = res.Data.map((auditoria: any) => {
          const estadoId = auditoria.estado?.estado_id;
          const acciones = this.getAccionesPorRolYEstado(estadoId);
          return { ...auditoria, acciones };
        });

        if (!(auditorias.length > 0)) {
          this.banderaTablaAuditoriasInternas = false;
          this.auditoriasDataSource.data = [];
          return this.alertService.showAlert(
            "No hay auditorías registradas",
            "Actualmente no hay auditorías registradas para la vigencia seleccionada."
          );
        }

        this.auditoriasPorVigencia = auditorias;
        this.totalRegistros = res.MetaData.Count;
        this.banderaTablaAuditoriasInternas = true;
        this.construirTabla();
      });
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

    if (!this.paginator) {
      this.auditoriasDataSource.paginator = this.paginator;
      this.auditoriasDataSource.sort = this.sort;
    }

    this.changeDetector.detectChanges();
  }

  manejarCambioPaginado(evento: PageEvent) {
    this.pageSize = evento.pageSize;
    this.pageIndex = evento.pageIndex;

    const offset = this.pageIndex * this.pageSize;
    this.listarAuditoriasPorVigencia(this.vigenciaId, this.pageSize, offset);
    this.paginator.length = this.totalRegistros;
    this.paginator.pageSize = this.pageSize;
    this.paginator.pageIndex = this.pageIndex;
  }

  getAccionesPorRolYEstado(estado: number) {
    return Array.from(
      new Set(
        this.roles.flatMap((rol) => accionesPlaneacion[rol]?.[estado] || [])
      )
    );
  }

  getIconoAccion(accion: string): string {
    return this.iconosAccion.get(accion) ?? "help";
  }

  realizarAccion(auditoria: any, accion: string) {
    const acciones: Record<string, Function | null> = {
      "Ver Documento": () => this.verDocumento(auditoria),
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
      .get(`plantilla/programa-auditoria/${auditoriaId}`)
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

  verDocumentos(auditoria: Auditoria) {
    const auditoriaId = auditoria._id;
    this.dialog.open(ModalVerDocumentosComponent, {
      width: "1200px",
      data: {
        entityId: auditoriaId,
        inferTabs: false,
        tabs: [
          { nombre: "Programa de auditoría", tipoId: environment.TIPO_DOCUMENTO_PARAMETROS.PROGRAMA_TRABAJO },
          { nombre: "Solicitud de información", tipoId: environment.TIPO_DOCUMENTO_PARAMETROS.SOLICITUD_INFORMACION },
          { nombre: "Carta de representación", tipoId: environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION },
          { nombre: "Compromiso ético", tipoId: environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO },
        ],
        titulo: `${auditoria.titulo}`,
        descripcion: `Documentos asociados a la auditoría`
      },
      autoFocus: false,
    });
  }

  verAuditoria(auditoria: Auditoria) {
    console.log(auditoria);
  }

  editarAuditoria(auditoria: Auditoria) {
    const auditoriaId = auditoria._id;
    this.router.navigate([
      `/planeacion/auditorias-internas/editar/${auditoriaId}`,
    ]);
  }

  revisarAuditoria(auditoria: Auditoria) {
    const auditoriaId = auditoria._id;
    this.router.navigate([
      `/planeacion/auditorias-internas/revision/${auditoriaId}`,
    ]);
  }

  preguntarEnvioAprobacionPorJefe(auditoria: Auditoria) {
    this.alertService
      .showConfirmAlert("¿Está seguro(a) de enviar a aprobación por Jefe?")
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }
        this.validarDocumentosAnexados(auditoria._id);
        delete auditoria.estado_interno_id;
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
   * Resuelve el nombre del remitente autenticado y los datos de la auditoría en paralelo,
   * luego envía el correo y registra la notificación si el envío fue exitoso.
   */
  /**
   * Notifica al Jefe OCI cuando un auditor envía el programa de auditoría a revisión.
   * Sigue el patrón de consulta-plan-auditoria: resuelve Terceros primero y sola,
   * luego encadena la consulta de la auditoría y el envío de notificación.
   */
  private notificarEnvioAJefe(auditoriaId: string): void {
    const rolRemitente = [
      environment.ROL.AUDITOR_EXPERTO,
      environment.ROL.AUDITOR,
      environment.ROL.AUDITOR_ASISTENTE,
    ].find(rol => this.rolService.tieneRol(rol)) || "Auditor";

    this.tercerosService.getAuthenticatedUserTerceroIdentification().pipe(

      exhaustMap((tercero) =>
        forkJoin({
          auditoria: this.planAuditoriaService.get(`auditoria/${auditoriaId}`),
          vigencias: this.parametrosUtilsService.getVigencias(),
          nombreRemitente: of(tercero.NombreCompleto),
        })
      ),

      exhaustMap(({ auditoria, vigencias, nombreRemitente }: any) => {
        const datosAuditoria = auditoria?.Data;

        // Resolver vigencia igual que el PAA — desde ParametrosUtilsService
        const vigenciaId = datosAuditoria?.vigencia_id;
        const vigenciaObj = vigencias.find((v: any) => v.Id === vigenciaId);
        const vigenciaNombre = vigenciaObj?.Nombre || (vigenciaId ? String(vigenciaId) : "");

        const destinatarios: DestinatariosEmail = this.tercerosService.combinarDestinatarios(
          [],
          environment.NOTIFICACION_PROGRAMA_TRABAJO_ENVIO_JEFE_DESTINATARIOS
        );

        const variablesSolicitud: VariablesSolicitud = {
          titulo_solicitud: "Revisión de Programa de Auditoría",
          tipo_solicitud: "revisión y aprobación",
          nombre_documento: `Programa de Auditoría${datosAuditoria?.titulo ? ` - ${datosAuditoria.titulo}` : ''}`,
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

  /**
   * Registra un log de notificación enviada en el CRUD de notificaciones (MongoDB).
   */
  private registrarNotificacion(
    auditoriaId: string,
    destinatarios: DestinatariosEmail,
    variables: VariablesSolicitud,
    tipoNotificacion: string,
    template: string = PLANTILLA_SOLICITUD_NOMBRE,
  ): void {
    const payload = {
      template: template,
      fecha_envio: new Date(),
      metadatos: {
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

  validarDocumentosAnexados(auditoriaId: any) {
    const docs = [
      { tipo: this.tipoDocumentoParametros.SOLICITUD_INFORMACION, nombre: 'solicitud de información' },
      { tipo: this.tipoDocumentoParametros.CARTA_PRESENTACION, nombre: 'carta de presentación' },
      { tipo: this.tipoDocumentoParametros.COMPROMISO_ETICO, nombre: 'compromiso ético' },
      { tipo: this.tipoDocumentoParametros.PROGRAMA_TRABAJO, nombre: 'programa de auditoría' },
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