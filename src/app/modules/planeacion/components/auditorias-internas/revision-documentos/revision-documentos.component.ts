import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ModalRechazoAuditoriaComponent } from "./modal-rechazo-auditoria/modal-rechazo-auditoria.component";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { environment } from "src/environments/environment";
import { rolesAprobacion } from "./revision-documentos.utilidades";

// Servicios
import { RolService } from "src/app/core/services/rol.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { UserService } from "src/app/core/services/user.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { ReferenciaPdfService, DocumentoReferenciaPdf } from "src/app/core/services/referencia-pdf.service";
import { BotonTabDocumentoContext, ModalVerDocumentosComponent, TabDocumento } from "src/app/shared/elements/components/dialogs/modal-ver-documentos/modal-ver-documentos.component";
import { TercerosService, VinculacionResponse } from "src/app/shared/services/terceros.service";
import { NotificacionesService, DestinatariosEmail, VariablesSolicitud, VariablesCartaRepresentacion } from "src/app/shared/services/notificaciones.service";
import { NotificacionRegistroCrudService } from "src/app/core/services/notificacion-registro-crud.service";
import { PLANTILLA_SOLICITUD_NOMBRE } from "src/app/core/services/notificaciones-mid.service";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { firstValueFrom, forkJoin, lastValueFrom, of, throwError } from "rxjs";
import { catchError, exhaustMap, switchMap, tap } from "rxjs/operators";
import { ModalAprobacionAuditadoComponent } from "./modal-aprobacion-auditado/modal-aprobacion-auditado.component";

interface DocumentoAdjuntoRevision {
  _id?: string;
  referencia_id?: string;
  referencia_tipo?: string;
  tipo_id: number;
  nuxeo_enlace: string;
  nombre?: string;
  metadatos?: Record<string, any>;
}

interface CartaRepresentacionRevision {
  base64: string;
  dependenciaNombre: string;
}

interface DocumentoRevisionItem {
  titulo: string;
  base64: string;
  tipo_id: number | null;
  nombreArchivo?: string;
}

@Component({
  selector: "app-revision-documentos",
  templateUrl: "./revision-documentos.component.html",
  styleUrl: "./revision-documentos.component.css",
})
export class RevisionDocumentosComponent implements OnInit {
  auditoriaId: string = "";
  estadoAuditoriaId!: number;
  selectedTab: number = 0;
  documentosVisibles: DocumentoRevisionItem[] = [];
  role: string | null = null;
  rolauditoriaIdesAprobacion: any;
  rolesAprobacion: any;
  usuarioId: any;
  documentos: { base64: string; tipo_id: number }[] = [];
  dependenciasPorId: Map<number, string> = new Map<number, string>();
  docProgramaTrabajo: string = "";
  docSolicitudInformacion: string = "";
  cartasRepresentacion: CartaRepresentacionRevision[] = [];
  docCompromisoEtico: string = "";
  cargueCartasDialogRef?: MatDialogRef<any>;

  constructor(
    public dialog: MatDialog,
    private readonly alertService: AlertService,
    private readonly rolService: RolService,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService,
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly nuxeoService: NuxeoService,
    private readonly descargaService: DescargaService,
    private readonly tercerosService: TercerosService,
    private readonly notificacionesService: NotificacionesService,
    private readonly notificacionRegistroCrudService: NotificacionRegistroCrudService,
    private readonly parametrosUtilsService: ParametrosUtilsService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
  ) { }

  ngOnInit(): void {
    this.inicializarDatos();
    this.cargarEstadoAuditoria();
  }

  inicializarDatos() {
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
    this.rolesAprobacion = rolesAprobacion;
    this.obtenerRolPrioritario();
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
    });
    this.cargarDocumentos();
  }

  cargarEstadoAuditoria() {
    this.planAuditoriaService
      .get(
        `auditoria-estado?query=auditoria_id:${this.auditoriaId},actual:true`
      )
      .subscribe((res) => {
        this.estadoAuditoriaId =
          res.Data[0]?.estado_id ??
          environment.AUDITORIA_ESTADO.PROGRAMACION.BORRADOR_ID;
      });
  }

  verificarFirmaCartaYPreguntarAprobacion(cartas: DocumentoAdjuntoRevision[]) {
    for (const carta of cartas) {
      if (!carta.metadatos!["firmado"]) {
        this.alertService.showAlert(
          "Carta sin firmar",
          `La carta de representación para la dependencia ${this.resolverNombreDependencia(carta, 0)} no ha sido cargada con firma. Por favor, cargue la carta firmada antes de aprobar la auditoría.`
        );
        return;
      }
    }

    this.preguntarAprobacionAuditoria();
  }

  preguntarAprobacionAuditoria() {
    const rolAprobacion = this.rolesAprobacion[this.role!];

    if (!rolAprobacion) {
      return;
    }

    const { estadoAprobacion, mensajeAprobacion, preguntaAprobacion } =
      rolAprobacion;

    this.alertService
      .showConfirmAlert(preguntaAprobacion)
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }

        if (Array.isArray(estadoAprobacion)) {
          this.aprobarAuditoriaSecuencial(estadoAprobacion, mensajeAprobacion);
        } else {
          this.aprobarAuditoria(estadoAprobacion, mensajeAprobacion).then(() =>
            this.notificarAceptacionAuditado(this.auditoriaId)
          )
        }
      });
  }

  async aprobarAuditoriaSecuencial(
    estadoAprobacion: number[],
    mensajeAprobacion: string
  ) {
    try {
      for (let i = 0; i < estadoAprobacion.length; i++) {
        const esUltimoEstado = i === estadoAprobacion.length - 1;
        await this.aprobarAuditoria(estadoAprobacion[i], mensajeAprobacion, esUltimoEstado);
      }
      // El Jefe aprueba y envía a revisión del auditado (último estado del array)
      // Se notifica al auditado con copia al auditor
      const ultimoEstado = estadoAprobacion[estadoAprobacion.length - 1];
      if (ultimoEstado === environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO) {
        this.notificarEnvioAuditado(this.auditoriaId);
      }
    } catch (error) {
      this.alertService.showErrorAlert("Error al aprobar el plan.");
    }
  }

  aprobarAuditoria(estadoAprobacion: number, mensajeAprobacion: string, mostrarMensaje: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
      const auditoriaEstado = this.construirObjetoAuditoriaEstado(estadoAprobacion);

      this.planAuditoriaService
        .post("auditoria-estado", auditoriaEstado)
        .subscribe({
          next: (res) => {
            if (mostrarMensaje) {
              this.alertService.showSuccessAlert(
                mensajeAprobacion,
                "Auditoría enviada"
              ).then(() => {
                try {
                  this.cargueCartasDialogRef?.close();
                } catch (e) {
                  console.error("Error al cerrar el modal de cargue de cartas firmadas", e);
                }

                this.router.navigate([`/planeacion/auditorias-internas/`]);
                resolve();
              });
            } else {
              resolve();
            }
          },
          error: (error) => {
            this.alertService.showErrorAlert("Error al aprobar el plan.");
            reject(error);
          }
        });
    });
  }

  construirObjetoAuditoriaEstado(estadoAprobacion: number) {
    return {
      auditoria_id: this.auditoriaId,
      usuario_id: this.usuarioId,
      usuario_rol: this.role,
      observacion: "",
      fase_id: environment.AUDITORIA_FASE.PLANEACION,
      estado_id: estadoAprobacion,
    };
  }

  abrirModalRechazo(): void {
    this.dialog.open(ModalRechazoAuditoriaComponent, {
      width: "50%",
      data: {
        usuarioId: this.usuarioId,
        role: this.role,
        auditoriaId: this.auditoriaId,
      },
    });
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }

  regresarRuta() {
    this.router.navigate([`/planeacion/auditorias-internas`]);
  }

  obtenerRolPrioritario() {
    this.role = this.rolService.getRolPrioritario([
      environment.ROL.SECRETARIO,
      environment.ROL.AUDITOR_EXPERTO,
      environment.ROL.AUDITOR,
      environment.ROL.AUDITOR_ASISTENTE,
      environment.ROL.JEFE,
      environment.ROL.JEFE_DEPENDENCIA,
      environment.ROL.ASISTENTE_DEPENDENCIA,
    ]);
  }

  mostrarAcciones(role: string, estadoAuditoriaId: number): boolean {
    const condicionesVisibilidad: { [key: string]: number[] } = {
      [environment.ROL.JEFE]: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE],
      auditado: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO],
      [environment.ROL.JEFE_DEPENDENCIA]: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO],
      [environment.ROL.ASISTENTE_DEPENDENCIA]: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO],
    };
    return condicionesVisibilidad[role]?.includes(estadoAuditoriaId) || false;
  }

  puedeCargarCartaFirmada(): boolean {
    const esAuditado =
      this.role === environment.ROL.JEFE_DEPENDENCIA ||
      this.role === environment.ROL.ASISTENTE_DEPENDENCIA;

    return (
      esAuditado &&
      this.estadoAuditoriaId ===
        environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_AUDITADO
    );
  }

  async cargarCartasAuditado() {
      var cartas = (await lastValueFrom(
        this.referenciaPdfService.consultarDocumentos(this.auditoriaId, {
          deduplicarPorTipo: false,
        })
      )).filter((documento) =>
        documento.tipo_id === environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION
      ) as DocumentoAdjuntoRevision[];

      const dependenciasAuditado = await this.obtenerDependenciasIdAuditado();
      cartas = cartas.filter((carta) =>
        this.deberiaMostrarCarta(carta, dependenciasAuditado)
      );
      return cartas;
  }

  async obtenerDependenciasIdAuditado(): Promise<number[]> {
    const cargosAuditado = [environment.CARGO.JEFE_DEPENDENCIA_ID, environment.CARGO.ASISTENTE_DEPENDENCIA_ID];
    return firstValueFrom(this.tercerosService.getVinculacionByTerceroId(this.usuarioId).pipe(
      switchMap((vinculaciones: VinculacionResponse[]) =>
        of(vinculaciones.filter((v) =>
          v.DependenciaId != null && cargosAuditado.includes(v.CargoId)
        ).map((v) => v.DependenciaId))
      ),
      catchError((error) =>
        throwError(() => new Error("Error al obtener las vinculaciones del auditado", error))
      ),
      switchMap((dependenciasIds: number[]) => {
        const idsUnicos = [...new Set(dependenciasIds)];
        console.debug("Dependencias ID únicas para el auditado:", idsUnicos);
        return of(idsUnicos);
      }),
    ));
  };

  async abrirModalCargueCartasFirmadas(): Promise<void> {
    try {
      let cartasAuditado = await this.cargarCartasAuditado();
      console.debug("Cartas de representación visibles para modal:", cartasAuditado);

      if (!Array.isArray(cartasAuditado) || cartasAuditado.length === 0) {
        this.alertService.showAlert(
          "Sin cartas disponibles",
          "No se encontraron cartas de representación para cargar firma."
        );
        return;
      }

      const tabs: TabDocumento[] = cartasAuditado.map((documento, index): TabDocumento => {
        const dependenciaNombre = this.resolverNombreDependencia(documento, index);

        return {
          nombre: `Carta de representación ${dependenciaNombre}`,
          tipoId: environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION,
          documentoId: documento._id,
          botones: [{
            nombre: "Descargar Carta",
            color: "primary",
            estilo: "border: 1px solid var(--md-primary-500);",
            tipo: "stroked",
            accion: async () => {
              const base64 = await this.nuxeoService.obtenerPorUUID(documento.nuxeo_enlace);
              this.descargaService.descargarArchivo(
                base64, "application/pdf", `Carta_Representacion_${dependenciaNombre}`
              );
            }
          }],
          cargueAdjuntoConfig: {
            nombreBoton: "Cargar Carta Firmada",
            iconoBoton: "upload_file",
            colorBoton: "primary",
            tipoBoton: "stroked",
            estiloBoton: "border: 1px solid var(--md-primary-500);",
            idTipoDocumento: environment.TIPO_DOCUMENTO.PROGRAMA_TRABAJO_AUDITORIA,
            descripcion: `Carta de representación firmada - ${dependenciaNombre}`,
            referenciaTipoFallback: "Auditoria",
            metadatosAdicionales: { firmado: true },
            onSuccess: async () => {
              cartasAuditado = await this.cargarCartasAuditado();
              this.cargarDocumentos();
            },
          },
        };
      });

      this.cargueCartasDialogRef = this.dialog.open(ModalVerDocumentosComponent, {
        width: "1200px",
        data: {
          entityId: this.auditoriaId,
          titulo: "Cartas de representación",
          descripcion:
            "Revise y cargue la carta de representación firmada para cada dependencia.",
          tabs,
          tipo: environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION,
          textoBotonCerrar: "Cerrar",
          accionesFooter: [
            {
              nombre: this.rolesAprobacion[this.role!].botonAprobacion,
              icono: "fact_check",
              color: "primary",
              accion: async () => this.verificarFirmaCartaYPreguntarAprobacion(cartasAuditado),
            },
          ],
        },
      });
    } catch (error) {
      console.error("Error al abrir modal de cargue de cartas firmadas", error);
      this.alertService.showErrorAlert(
        "No fue posible abrir el modal de cargue de cartas firmadas."
      );
    }
  }

  cargarDocumentos() {
    this.documentos = [];
    this.cartasRepresentacion = [];
    this.documentosVisibles = [];

    const tipoDocumentoMap = {
      [environment.TIPO_DOCUMENTO_PARAMETROS.PROGRAMA_TRABAJO]:
        "docProgramaTrabajo",
      [environment.TIPO_DOCUMENTO_PARAMETROS.SOLICITUD_INFORMACION]:
        "docSolicitudInformacion",
      [environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO]:
        "docCompromisoEtico",
    };

    if (this.role === environment.ROL.JEFE_DEPENDENCIA || this.role === environment.ROL.ASISTENTE_DEPENDENCIA) {
      this.filtrarDocumentosPorDependenciaAuditado(tipoDocumentoMap);
    } else {
      this.referenciaPdfService
        .consultarDocumentos(this.auditoriaId, {
          deduplicarPorTipo: false,
        })
        .subscribe(async (documentosAdjuntos: DocumentoReferenciaPdf[]) => {
          await this.cargarDependenciasPorAuditoria();

          let indiceCarta = 0;
          const promesas = documentosAdjuntos.map(async (documento, index) => {
            if (!documento?.nuxeo_enlace) {
              return null;
            }

          const base64 = await this.nuxeoService.obtenerPorUUID(documento.nuxeo_enlace);

          if (documento.tipo_id === environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION) {
            this.documentos.push({ base64, tipo_id: documento.tipo_id });

            const indiceCartaActual = indiceCarta;
            indiceCarta += 1;

            return {
              base64,
              dependenciaNombre: this.resolverNombreDependencia(documento, indiceCartaActual),
            };
          }

          const propiedad = tipoDocumentoMap[documento.tipo_id];
          if (propiedad) {
            (this as any)[propiedad] = base64;
          }

          this.documentos.push({ base64, tipo_id: documento.tipo_id });
          return null;
        });

        const cartasEncontradas = await Promise.all(promesas);
        this.cartasRepresentacion = cartasEncontradas.filter(
          (carta): carta is CartaRepresentacionRevision => !!carta
        );

        await this.cargarDependenciasPorAuditoria();
        this.actualizarDocumentosVisibles();
      });
    }
  }

  private async cargarDependenciasPorAuditoria(): Promise<void> {
    this.dependenciasPorId = new Map<number, string>();

    try {
      const res = await new Promise<any>((resolve, reject) => {
        this.planAuditoriaMid.get(`auditoria/${this.auditoriaId}`).subscribe({
          next: resolve,
          error: reject,
        });
      });

      const auditoria = res?.Data || {};
      const dependenciasIds = Array.isArray(auditoria.dependencia_id)
        ? auditoria.dependencia_id
        : [];
      const dependenciasNombres = Array.isArray(auditoria.dependencia_nombre)
        ? auditoria.dependencia_nombre
        : typeof auditoria.dependencia_nombre === "string" && auditoria.dependencia_nombre.trim()
          ? [auditoria.dependencia_nombre]
          : [];

      dependenciasIds.forEach((dependenciaId: number, index: number) => {
        if (typeof dependenciaId !== "number") {
          return;
        }

        const nombreDependencia = this.normalizarNombreDependencia(dependenciasNombres[index]);
        if (nombreDependencia) {
          this.dependenciasPorId.set(dependenciaId, nombreDependencia);
        }
      });
    } catch (error) {
      console.warn("No fue posible cargar las dependencias de la auditoría", error);
    }
  }

  private actualizarDocumentosVisibles(): void {
    const documentosBase: DocumentoRevisionItem[] = [
      {
        titulo: "Programa de trabajo",
        base64: this.docProgramaTrabajo,
        tipo_id: environment.TIPO_DOCUMENTO_PARAMETROS.PROGRAMA_TRABAJO,
      },
      {
        titulo: "Oficio Anuncio Solicitud de Información",
        base64: this.docSolicitudInformacion,
        tipo_id: environment.TIPO_DOCUMENTO_PARAMETROS.SOLICITUD_INFORMACION,
      },
      ...this.cartasRepresentacion.map((carta) => ({
        titulo: `Carta de representación ${this.formatearNombreDependencia(carta.dependenciaNombre)}`,
        base64: carta.base64,
        tipo_id: environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION,
        nombreArchivo: `Carta de representación ${this.formatearNombreDependencia(carta.dependenciaNombre)}`,
      })),
      {
        titulo: "Compromiso Ético del Auditor Interno",
        base64: this.docCompromisoEtico,
        tipo_id: environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO,
      },
    ];

    this.documentosVisibles = documentosBase.filter((documento) => !!documento.base64);

    if (this.selectedTab >= this.documentosVisibles.length) {
      this.selectedTab = 0;
    }
  }

  private resolverNombreDependencia(documento: DocumentoAdjuntoRevision, index: number): string {
    const fallback = `Dependencia ${index + 1}`;

    const nombreDesdeDocumento = this.extraerNombreDependencia(documento?.nombre, "");
    if (nombreDesdeDocumento) {
      return this.formatearNombreDependencia(nombreDesdeDocumento);
    }

    const dependenciaId = documento?.metadatos?.["dependencia_id"];
    if (typeof dependenciaId === "number") {
      const nombrePorId = this.dependenciasPorId.get(dependenciaId);
      if (nombrePorId) {
        return this.formatearNombreDependencia(nombrePorId);
      }
    }

    return this.formatearNombreDependencia(
      this.extraerNombreDependencia(documento?.nombre, fallback)
    );
  }

  private normalizarNombreDependencia(nombre: unknown): string | null {
    if (typeof nombre !== "string") {
      return null;
    }

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio || /^\d+$/.test(nombreLimpio)) {
      return null;
    }

    return this.formatearNombreDependencia(nombreLimpio);
  }

  private formatearNombreDependencia(nombre: string): string {
    return nombre
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(" ");
  }

  private extraerNombreDependencia(nombreDocumento: string | undefined, fallback: string): string {
    if (typeof nombreDocumento === "string" && nombreDocumento.includes(" - ")) {
      const partes = nombreDocumento.split(" - ");
      const posibleNombre = partes[partes.length - 1].trim();

      if (posibleNombre) {
        return posibleNombre;
      }
    }

    return fallback;
  }

  private deberiaMostrarCarta(
    carta: DocumentoAdjuntoRevision,
    dependenciasAuditado: number[]
  ): boolean {
    if (![environment.ROL.JEFE_DEPENDENCIA, environment.ROL.ASISTENTE_DEPENDENCIA].includes(this.role!))
      return true;

    const dependenciaId = Number(carta.metadatos?.["dependencia_id"]);
    return Number.isFinite(dependenciaId) && dependenciasAuditado.includes(dependenciaId);
  }

  async descargarTodo() {
    try {
      const documentosDescarga = this.documentosVisibles
        .filter((documento) => !!documento.base64 && documento.tipo_id !== null)
        .map((documento) => ({
          base64: documento.base64,
          tipo_id: documento.tipo_id as number,
          fileName: documento.nombreArchivo,
        }));

      await this.descargaService.descargarMultiplesArchivos(
        documentosDescarga,
        "documentosAuditoria.zip"
      );
    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error);
    }
  }

  /**
 * Notifica a los actores de cada dependencia asociada a la auditoría (correo_dependencia,
 * jefe_correo, asistente_correo y correo_complementario si existe) cuando el Jefe OCI
 * aprueba y envía el programa de auditoría a revisión del auditado.
 * Los auditores asignados reciben copia (Cc).
 *
 * Los correos se resuelven desde `datos_dependencias`, que soporta múltiples dependencias
 * por auditoría. Los campos opcionales (jefe, asistente, complementario) solo se incluyen
 * si el MID los retorna.
 *
 */
  private notificarEnvioAuditado(auditoriaId: string): void {
    const rolRemitente = "Jefe OCI";

    this.tercerosService.getAuthenticatedUserTerceroIdentification().pipe(

      exhaustMap((tercero) => {
        return forkJoin({
          auditoria: this.planAuditoriaMid.get(`auditoria/${auditoriaId}`),
          auditores: this.planAuditoriaService.get(
            `auditor?query=auditoria_id:${auditoriaId},asignado:true,activo:true&limit=0`
          ),
          vigencias: this.parametrosUtilsService.getVigencias(),
          nombreRemitente: of(tercero.NombreCompleto),
        });
      }),

      exhaustMap(({ auditoria, auditores, vigencias, nombreRemitente }: any) => {
        const datosAuditoria = auditoria?.Data;
        const listaAuditores: any[] = auditores?.Data ?? [];
        const dependenciasInfo: any[] = datosAuditoria?.datos_dependencias ?? [];
        dependenciasInfo.forEach((dep) => 
          datosAuditoria.correo_complementario.forEach((correo: any) => {
            if (correo.dependencia_id === dep.dependencia_id)
              dep.correo_complementario = correo.correo;
          })
        );

        const vigenciaId = datosAuditoria?.vigencia_id;
        const vigenciaObj = vigencias.find((v: any) => v.Id === vigenciaId);
        const vigenciaNombre = vigenciaObj?.Nombre || (vigenciaId ? String(vigenciaId) : "");

        const correosAuditores$ = listaAuditores.length > 0
          ? forkJoin(
            listaAuditores.map((a: any) =>
              this.tercerosService.getTerceroById(a.auditor_id).pipe(
                catchError(() => of(null))
              )
            )
          )
          : of([]);

        return correosAuditores$.pipe(
          switchMap((terceros: any[]) => {
            const correosAuditores = terceros
              .filter((t) => t?.UsuarioWSO2)
              .map((t) => t.UsuarioWSO2)
              .filter((v: string) => v.includes('@'));

            const toAddressesDinamicos: string[] = dependenciasInfo.flatMap((dep) => {
              const correos: string[] = [];
              if (dep.correo_dependencia)    correos.push(dep.correo_dependencia);
              if (dep.jefe_correo)           correos.push(dep.jefe_correo);
              if (dep.asistente_correo)      correos.push(dep.asistente_correo);
              if (dep.correo_complementario) correos.push(dep.correo_complementario);
              return correos;
            });

            console.log(
              "[notificarEnvioAuditado] dependencias_info recibidas:",
              JSON.stringify(dependenciasInfo, null, 2)
            );
            console.log(
              "[notificarEnvioAuditado] ToAddresses resueltos:",
              toAddressesDinamicos
            );
            console.log(
              "[notificarEnvioAuditado] Cc auditores resueltos:",
              correosAuditores
            );

            const fijosEnvioAuditado = environment.NOTIFICACION_PROGRAMA_TRABAJO_ENVIO_AUDITADO_DESTINATARIOS;
            const destinatarios: DestinatariosEmail = {
              ToAddresses: [
                ...toAddressesDinamicos,
                ...(fijosEnvioAuditado.ToAddresses ?? []),
              ],
              CcAddresses: [
                ...correosAuditores,
                ...(fijosEnvioAuditado.CcAddresses ?? []),
              ],
              BccAddresses: fijosEnvioAuditado.BccAddresses ?? [],
            };

            console.log(
            "[notificarEnvioAuditado] Payload final destinatarios:",
            JSON.stringify(destinatarios, null, 2)
            );

            const variablesSolicitud: VariablesSolicitud = {
              titulo_solicitud: "Revisión de Programa de Auditoría",
              tipo_solicitud: "revisión y firma",
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
                    "envio_revision_auditado_programa_trabajo"
                  );
                }
              })
            );
          })
        );
      }),

      catchError((error) => {
        console.warn("Error al notificar envío a auditado:", error);
        return throwError(() => error);
      })

    ).subscribe({
      error: (err) => console.warn("Error en notificación envío a auditado:", err),
    });
  }

  /**
   * Notifica a los auditores asignados al programa cuando el auditado
   * (Jefe o Asistente de dependencia) firma y envía la aceptación de la auditoría
   * con el cargue del documento.
   * Los auditores reciben el correo en To, la dependencia auditada en Cc.
   */
  private notificarAceptacionAuditado(auditoriaId: string): void {
    const rolRemitente = "Dependencia Auditada";

    this.tercerosService.getAuthenticatedUserTerceroIdentification().pipe(

      exhaustMap((tercero) => {
        return forkJoin({
          auditoria: this.planAuditoriaMid.get(`auditoria/${auditoriaId}`),
          auditores: this.planAuditoriaService.get(
            `auditor?query=auditoria_id:${auditoriaId},asignado:true,activo:true&limit=0`
          ),
          vigencias: this.parametrosUtilsService.getVigencias(),
          nombreRemitente: of(tercero.NombreCompleto),
        });
      }),

      exhaustMap(({ auditoria, auditores, vigencias, nombreRemitente }: any) => {
        const datosAuditoria = auditoria?.Data;
        const listaAuditores: any[] = auditores?.Data ?? [];
        const dependenciasInfo: any[] = datosAuditoria?.datos_dependencias ?? [];

        const vigenciaId = datosAuditoria?.vigencia_id;
        const vigenciaObj = vigencias.find((v: any) => v.Id === vigenciaId);
        const vigenciaNombre = vigenciaObj?.Nombre || (vigenciaId ? String(vigenciaId) : "");

        const correosAuditores$ = listaAuditores.length > 0
          ? forkJoin(
              listaAuditores.map((a: any) =>
                this.tercerosService.getTerceroById(a.auditor_id).pipe(
                  catchError(() => of(null))
                )
              )
            )
          : of([]);

        return correosAuditores$.pipe(
          switchMap((terceros: any[]) => {
            // Auditores van al To
            const correosAuditores = terceros
              .filter((t) => t?.UsuarioWSO2)
              .map((t) => t.UsuarioWSO2)
              .filter((v: string) => v.includes('@'));

            // Dependencia auditada va al Cc
            const correosDependencia: string[] = dependenciasInfo.flatMap((dep) => {
              const correos: string[] = [];
              if (dep.correo_dependencia)    correos.push(dep.correo_dependencia);
              if (dep.jefe_correo)           correos.push(dep.jefe_correo);
              if (dep.asistente_correo)      correos.push(dep.asistente_correo);
              if (dep.correo_complementario) correos.push(dep.correo_complementario);
              return correos;
            });

            console.log(
              "[notificarAceptacionAuditado] dependencias_info recibidas:",
              JSON.stringify(dependenciasInfo, null, 2)
            );
            console.log(
              "[notificarAceptacionAuditado] To auditores resueltos:",
              correosAuditores
            );
            console.log(
              "[notificarAceptacionAuditado] Cc dependencia resueltos:",
              correosDependencia
            );

            const fijos = environment.NOTIFICACION_ACEPTACION_AUDITADO_DESTINATARIOS;
            const destinatarios: DestinatariosEmail = {
              ToAddresses: [
                ...correosAuditores,
                ...(fijos?.ToAddresses ?? []),
              ],
              CcAddresses: [
                ...correosDependencia,
                ...(fijos?.CcAddresses ?? []),
              ],
              BccAddresses: fijos?.BccAddresses ?? [],
            };

            console.log(
              "[notificarAceptacionAuditado] Payload final destinatarios:",
              JSON.stringify(destinatarios, null, 2)
            );

            const variablesCartaRepresentacion: VariablesCartaRepresentacion = {
              dependencia:        dependenciasInfo[0]?.dependencia_nombre ?? "",
              tipo_auditoria:     datosAuditoria?.titulo ?? "",
              vigencia:           vigenciaNombre,
              nombre_quien_envia: nombreRemitente || rolRemitente,
              fecha_envio:        new Date().toLocaleDateString(),
            };

            return this.notificacionesService.enviarNotificacionCartaRepresentacion(
              destinatarios,
              variablesCartaRepresentacion
            ).pipe(
              tap((response: any) => {
                if (response?.Status == 200) {
                  this.registrarNotificacion(
                    auditoriaId,
                    destinatarios,
                    variablesCartaRepresentacion as any,
                    "aceptacion_auditado_cargue_documento"
                  );
                }
              })
            );
          })
        );
      }),

      catchError((error) => {
        console.warn("Error al notificar aceptación del auditado:", error);
        return throwError(() => error);
      })

    ).subscribe({
      error: (err) => console.warn("Error en notificación aceptación auditado:", err),
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

  mostrarRechazoAuditoria(role: string, estadoAuditoriaId: number): boolean {
    const condicionesVisibilidad: { [key: string]: number[] } = {
      [environment.ROL.JEFE]: [environment.AUDITORIA_ESTADO.PLANEACION.REVISION_PROGRAMA_JEFE],
    };
    return condicionesVisibilidad[role]?.includes(estadoAuditoriaId) || false;
  }

  private async filtrarDocumentosPorDependenciaAuditado(tipoDocumentoMap: any) {
    const personaId = await this.userService.getPersonaId();
    let cargoId: number | undefined;
    
    switch (this.role) {
      case environment.ROL.JEFE_DEPENDENCIA:
        cargoId = environment.CARGO.JEFE_DEPENDENCIA_ID;
        break;
      case environment.ROL.ASISTENTE_DEPENDENCIA:
        cargoId = environment.CARGO.ASISTENTE_DEPENDENCIA_ID;
        break;
    }

    this.planAuditoriaMid.get(`auditado/${personaId}/documento?auditoria_id=${this.auditoriaId}&cargo_id=${cargoId}`)
      .subscribe(async (res) => {
        await this.cargarDependenciasPorAuditoria();
        const dependenciasAuditado = await this.obtenerDependenciasIdAuditado();
        let indiceCarta = 0;

        const promesas = res.map(async (documento: any) => {
          if (!documento?.nuxeo_enlace) {
            return null;
          }

          if (
            documento.tipo_id === environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION &&
            !this.deberiaMostrarCarta(documento, dependenciasAuditado)
          ) {
            return null;
          }

          const base64 = await this.nuxeoService.obtenerPorUUID(documento.nuxeo_enlace);

          if (documento.tipo_id === environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION) {
            this.documentos.push({ base64, tipo_id: documento.tipo_id });

            const indiceCartaActual = indiceCarta;
            indiceCarta += 1;

            this.cartasRepresentacion.push({
              base64,
              dependenciaNombre: this.resolverNombreDependencia(documento, indiceCartaActual),
            });
            return null;
          }

          const propiedad = tipoDocumentoMap[documento.tipo_id];
          if (propiedad) {
            (this as any)[propiedad] = base64;
          }

          this.documentos.push({ base64, tipo_id: documento.tipo_id });
          return null;
        });

        await Promise.all(promesas);
        this.actualizarDocumentosVisibles();
      });
  }
}
