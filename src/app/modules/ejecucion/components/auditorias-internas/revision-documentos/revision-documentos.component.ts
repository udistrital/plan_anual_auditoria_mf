import Holidays from 'date-holidays';
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ModalRechazoAuditoriaEjecucionComponent } from "./modal-rechazo-auditoria/modal-rechazo-auditoria.component";
import { MatDialog } from "@angular/material/dialog";
import { environment } from "src/environments/environment";

//Servicios
import { RolService } from "src/app/core/services/rol.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { UserService } from "src/app/core/services/user.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { NotificacionesService, DestinatariosEmail, VariablesSolicitud } from "src/app/shared/services/notificaciones.service";
import { NotificacionRegistroCrudService } from "src/app/core/services/notificacion-registro-crud.service";
import { PLANTILLA_SOLICITUD_NOMBRE } from "src/app/core/services/notificaciones-mid.service";
import { TercerosService } from "src/app/shared/services/terceros.service";
import rolRemitentePorRol from "src/app/shared/utils/rolRemitentePorRol";

const configAuditado = {
  estadoAprobacion: [
    environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_AUDITADO,
    environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL
  ],
  estadoRechazo: environment.AUDITORIA_ESTADO.EJECUCION.OBSERVACIONES_PREINFORME_AUDITADO,
  preguntaAprobacion: "¿Está seguro(a) de aprobar la respuesta preliminar?",
  mensajeAprobacion: "El informe pasó a etapa de informe final",
  botonAprobacion: "Aceptar informe",
  botonRechazo: "Revisar hallazgos",
  esRedireccionHallazgos: true,
};

const configJefeFinal = {
  estadoAprobacion: [environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_INFORME_FINAL_JEFE],
  estadoRechazo: environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_INFORME_FINAL_JEFE,
  preguntaAprobacion: "¿Está seguro(a) de aprobar el informe final?",
  mensajeAprobacion: "El informe final fue aprobado",
  botonAprobacion: "Aprobar Informe Final",
  botonRechazo: "Rechazar Informe Final",
  modalRechazo: {
    titulo: "Rechazo de Informe Final",
    descripcion: "Descripción del rechazo del informe final",
    labelTextarea: "Descripción del rechazo del informe final",
    botonConfirmar: "Guardar",
    mensajeConfirmacion: "¿Está seguro(a) de rechazar el informe final?",
    mensajeExito: "Informe final rechazado",
    descripcionExito: "El informe final fue rechazado",
  },
};

const configJefe = {
  estadoAprobacion: [
    environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_JEFE,
    environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO,
  ],
  estadoRechazo: environment.AUDITORIA_ESTADO.EJECUCION.RECHAZADO_PREINFORME_JEFE,
  preguntaAprobacion: "¿Está seguro(a) de enviar el informe preliminar al auditado?",
  mensajeAprobacion: "El informe fue enviado al auditado",
  botonAprobacion: "Aprobar y Enviar a Auditado",
  botonRechazo: "Rechazar Informe",
};

@Component({
    selector: "app-revision-documentos-ejecucion",
    templateUrl: "./revision-documentos.component.html",
    styleUrl: "./revision-documentos.component.css",
    standalone: false
})
export class RevisionDocumentosEjecucionComponent implements OnInit {
  auditoriaId: string = "";
  estadoAuditoriaId!: number;
  selectedTab: number = 0;
  role: string | null = null;
  usuarioId: any;
  documentos: { base64: string; tipo_id: number }[] = [];
  opcionesDocumentos: { nombre: string; base64: string }[] = [];
  rolesAprobacion: { [key: string]: any } = {
    [environment.ROL.JEFE]: configJefe,
    [environment.ROL.JEFE_DEPENDENCIA]: configAuditado,
    [environment.ROL.ASISTENTE_DEPENDENCIA]: configAuditado,
  };

  constructor(
    public readonly dialog: MatDialog,
    private readonly alertService: AlertService,
    private readonly rolService: RolService,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService,
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly nuxeoService: NuxeoService,
    private readonly descargaService: DescargaService,
    private readonly notificacionesService: NotificacionesService,
    private readonly notificacionRegistroCrudService: NotificacionRegistroCrudService,
    private readonly tercerosService: TercerosService,
  ) { }

  ngOnInit(): void {
    this.inicializarDatos();
    this.cargarEstadoInforme();
  }

  inicializarDatos() {
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
    this.obtenerRolPrioritario();
    this.userService.getPersonaId().then((usuarioId) => { this.usuarioId = usuarioId; });
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

  cargarDocumentos() {
    this.documentos = [];

    const tipoDocumentoIndiceMap: { [key: number]: number } = {
      [environment.TIPO_DOCUMENTO_PARAMETROS.INFORME_PRELIMINAR]: 0,
      [environment.TIPO_DOCUMENTO_PARAMETROS.INFORME_FINAL]: 1,
      [environment.TIPO_DOCUMENTO_PARAMETROS.PROGRAMA_TRABAJO]: this.estadoAuditoriaId >= environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL ? 2 : 1,
      [environment.TIPO_DOCUMENTO_PARAMETROS.SOLICITUD_INFORMACION]: this.estadoAuditoriaId >= environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL ? 3 : 2,
      [environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION]: this.estadoAuditoriaId >= environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL ? 4 : 3,
      [environment.TIPO_DOCUMENTO_PARAMETROS.COMPROMISO_ETICO]: this.estadoAuditoriaId >= environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL ? 5 : 4,
    };

    this.opcionesDocumentos = this.estadoAuditoriaId >= environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL
      ? [
        { nombre: "Informe Preliminar", base64: "" },
        { nombre: "Informe Final", base64: "" },
        { nombre: "Programa de Trabajo", base64: "" },
        { nombre: "Oficio Anuncio Solicitud Información", base64: "" },
        { nombre: "Carta de Representación", base64: "" },
        { nombre: "Compromiso Ético del Auditor Interno", base64: "" },
      ]
      : [
        { nombre: "Informe Preliminar", base64: "" },
        { nombre: "Programa de Trabajo", base64: "" },
        { nombre: "Oficio Anuncio Solicitud Información", base64: "" },
        { nombre: "Carta de Representación", base64: "" },
        { nombre: "Compromiso Ético del Auditor Interno", base64: "" },
      ];

    this.referenciaPdfService
      .consultarDocumentos(this.auditoriaId)
      .subscribe(async (res) => {
        const promesas = res.map(async (documento) => {
          const base64 = await this.nuxeoService.obtenerPorUUID(documento.nuxeo_enlace);
          this.documentos.push({ base64, tipo_id: documento.tipo_id });

          const indice = tipoDocumentoIndiceMap[documento.tipo_id];
          if (indice !== undefined) {
            this.opcionesDocumentos[indice] = { ...this.opcionesDocumentos[indice], base64 };
          }
        });

        await Promise.all(promesas);
      });
  }

  preguntarAprobacion() {
    const rolAprobacion = this.rolesAprobacion[this.role!];
    if (!rolAprobacion) return;

    const estados = Array.isArray(rolAprobacion.estadoAprobacion)
      ? rolAprobacion.estadoAprobacion
      : [rolAprobacion.estadoAprobacion];

    this.alertService
      .showConfirmAlert(rolAprobacion.preguntaAprobacion)
      .then(confirmado => {
        if (!confirmado.value) return;
        this.aprobarAuditoria(estados, rolAprobacion.mensajeAprobacion);
      });
  }

  async aprobarAuditoria(estados: number[], mensajeAprobacion: string) {
    try {
      for (const estado of estados) {
        const auditoriaEstado = this.construirObjetoAuditoriaEstado(estado);
        await this.planAuditoriaService.post("auditoria-estado", auditoriaEstado).toPromise();
      }      

      if (estados.includes(environment.AUDITORIA_ESTADO.EJECUCION.APROBADO_PREINFORME_JEFE)) {
        await this.guardarFechaRevisionPreinforme();
      }

      const mensaje = this.estadoAuditoriaId === environment.AUDITORIA_ESTADO.EJECUCION.REVISION_INFORME_FINAL_JEFE
        ? "Informe final enviado"
        : "Informe preliminar enviado";
      this.alertService.showSuccessAlert(mensajeAprobacion, mensaje);
      this.router.navigate([`/ejecucion/auditorias-internas/`]);
    } catch (error) {
      this.alertService.showErrorAlert("Error al aprobar el informe.");
    }
  }

  private async guardarFechaRevisionPreinforme(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.planAuditoriaService.get(`informe?query=auditoria_id:${this.auditoriaId}`)
      );
      const informeId = res?.Data?.[0]?._id;
      if (!informeId) return;
      const dias = environment.DIAS_REVISION_PREINFORME;
      const fechaFin = this.calcularFechaFinHabiles(new Date(), dias);
      await firstValueFrom(
        this.planAuditoriaService.put(`informe/${informeId}`, { fecha_fin_revision: fechaFin, dias_revision: dias })
      );
      this.notificarEnvioPreinformeAuditado(fechaFin);
    } catch {
      // no bloquea el flujo de aprobación
    }
  }

  private readonly _hd = new Holidays('CO');
  private readonly _festivosCache: Record<number, Set<string>> = {};

  private calcularFechaFinHabiles(desde: Date, dias: number): Date {
    const result = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());

    const startYear = result.getFullYear();
    if (!this._festivosCache[startYear]) {
      const festivos = this._hd.getHolidays(startYear)
        .filter(h => h.type === 'public')
        .map(h => h.date.substring(0, 10));
      this._festivosCache[startYear] = new Set(festivos);
    }
    const startKey = `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`;
    // El día de revisión cuenta (sábado/domingo incluidos), excepto si es festivo
    let count = this._festivosCache[startYear].has(startKey) ? 0 : 1;

    while (count < dias + 1) {
      result.setDate(result.getDate() + 1);
      const dow = result.getDay();
      if (dow === 0 || dow === 6) continue;

      const year = result.getFullYear();
      if (!this._festivosCache[year]) {
        const festivos = this._hd.getHolidays(year)
          .filter(h => h.type === 'public')
          .map(h => h.date.substring(0, 10));
        this._festivosCache[year] = new Set(festivos);
      }

      const key = `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`;
      if (!this._festivosCache[year].has(key)) count++;
    }

    return result;
  }

  private async notificarEnvioPreinformeAuditado(fechaFin: Date): Promise<void> {
    try {
      const [auditoriaRes, tercero]: [any, any] = await Promise.all([
        firstValueFrom(this.planAuditoriaMid.get(`auditoria/${this.auditoriaId}`)),
        firstValueFrom(this.tercerosService.getAuthenticatedUserTerceroIdentification()).catch(() => null),
      ]);

      const datosAuditoria = auditoriaRes?.Data;

      // Obtener correos de dependencias
      const dependenciasInfo: any[] = datosAuditoria?.datos_dependencias ?? [];
      const correosDependencias: string[] = dependenciasInfo.flatMap((dep: any) => {
        const correos: string[] = [];
        if (dep.jefe_correo) correos.push(dep.jefe_correo);
        if (dep.asistente_correo) correos.push(dep.asistente_correo);
        if (dep.correo_dependencia) correos.push(dep.correo_dependencia);
        if (dep.correo_complementario) correos.push(dep.correo_complementario);
        return correos;
      });

      // Obtener correos complementarios adicionales
      const correosComplementarios: string[] = datosAuditoria?.correo_complementario ?? [];
      const correosComplementariosFinales = correosComplementarios.flatMap((depComp: any) => {
        const correosComp: string[] = [];
        if (depComp.correo) correosComp.push(depComp.correo);
        return correosComp;
      });

      const fechaLimiteFormateada = fechaFin.toLocaleDateString('es-CO', {
        timeZone: 'America/Bogota',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const destinatariosFijos = environment.NOTIFICACION_PREINFORME_ENVIO_AUDITADO_DESTINATARIOS;
      const destinatarios: DestinatariosEmail = {
        ToAddresses: [...correosDependencias, ...correosComplementariosFinales, ...(destinatariosFijos.ToAddresses ?? [])],
        CcAddresses: destinatariosFijos.CcAddresses ?? [],
        BccAddresses: destinatariosFijos.BccAddresses ?? [],
      };

      const variables: VariablesSolicitud = {
        titulo_solicitud: 'Revisión de Informe Preliminar',
        tipo_solicitud: `Revisión del informe preliminar. Fecha límite: ${fechaLimiteFormateada}`,
        nombre_documento: `Informe Preliminar${datosAuditoria?.titulo ?  ' - ' + datosAuditoria.titulo : ''}`,
        vigencia: datosAuditoria?.vigencia_nombre ?? String(datosAuditoria?.vigencia_id ?? ''),
        rol_remitente: rolRemitentePorRol[this.role!] ?? 'Jefe OCI',
        nombre_remitente: tercero?.NombreCompleto ?? 'Jefe OCI',
        fecha_envio: new Date().toLocaleDateString('es-CO'),
      };

      const response: any = await firstValueFrom(
        this.notificacionesService.enviarNotificacionSolicitud(destinatarios, variables)
      );

      if (response?.Status == 200) {
        this.registrarNotificacion(destinatarios, variables);
      }
    } catch (error) {
      console.warn('Error al notificar envío de preinforme a auditado:', error);
    }
  }

  private registrarNotificacion(
    destinatarios: DestinatariosEmail,
    variables: VariablesSolicitud,
  ): void {
    const payload = {
      plantilla: PLANTILLA_SOLICITUD_NOMBRE,
      fecha_envio: new Date(),
      metadato: {
        ...variables,
        tipo_notificacion: 'envio_preinforme_auditado',
        destinatarios_to: destinatarios.ToAddresses ?? [],
        destinatarios_cc: destinatarios.CcAddresses ?? [],
        destinatarios_bcc: destinatarios.BccAddresses ?? [],
      },
      referencia_id: this.auditoriaId,
      referencia_tipo: 'AUDITORIA INTERNA',
    };
    this.notificacionRegistroCrudService.post(payload).subscribe({
      next: (res) => console.debug('Registro de notificación guardado:', res),
      error: (err) => console.warn('Error guardando registro de notificación:', err),
    });
  }



  construirObjetoAuditoriaEstado(estadoAprobacion: number) {
    const faseId =
      estadoAprobacion === environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL
        ? environment.AUDITORIA_FASE.EJECUCION_FINAL
        : environment.AUDITORIA_FASE.EJECUCION_PRELIMINAR;

    return {
      auditoria_id: this.auditoriaId,
      fase_id: faseId,
      estado_id: estadoAprobacion,
      usuario_id: this.usuarioId,
      usuario_rol: this.role,
      observacion: "",
    };
  }

  accionBotonRechazo(): void {
    const rolConfig = this.rolesAprobacion[this.role!];
    if (rolConfig?.esRedireccionHallazgos) {
      this.revisarHallazgos();
    } else {
      this.abrirModalRechazo();
    }
  }

  abrirModalRechazo(): void {
    const rolConfig = this.rolesAprobacion[this.role!];
    const modalConfig = rolConfig?.modalRechazo;
    this.dialog.open(ModalRechazoAuditoriaEjecucionComponent, {
      width: "40%",
      data: {
        usuarioId: this.usuarioId,
        role: this.role,
        auditoriaId: this.auditoriaId,
        estadoRechazo: rolConfig?.estadoRechazo,
        ...modalConfig,
      },
    });
  }

  revisarHallazgos(): void {
    this.planAuditoriaService.get(`informe?query=auditoria_id:${this.auditoriaId}`).subscribe({
      next: (res: any) => {
        const informeId = res?.Data?.[0]?._id;
        if (!informeId) {
          this.alertService.showErrorAlert("No se encontró el informe asociado a esta auditoría.");
          return;
        }
        this.router.navigate([`/ejecucion/auditorias-internas/editar-informe/${informeId}`], {
          queryParams: { step: 4 },
        });
      },
      error: () => this.alertService.showErrorAlert("Error al buscar el informe."),
    });
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }

  regresarRuta() {
    this.router.navigate([`/ejecucion/auditorias-internas`]);
  }

  cargarEstadoInforme() {
    this.planAuditoriaService
      .get(`auditoria-estado?query=auditoria_id:${this.auditoriaId},actual:true`)
      .subscribe((res) => {
        this.estadoAuditoriaId = res.Data[0]?.estado_id ?? environment.AUDITORIA_ESTADO.EJECUCION.POR_EJECUTAR;
        this.configurarRevisionSegunEstado();
        this.cargarDocumentos();
      });
  }

  private configurarRevisionSegunEstado(): void {
    if (this.estadoAuditoriaId >= environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL) {
      this.rolesAprobacion = {
        [environment.ROL.JEFE]: configJefeFinal,
      };
      return;
    }

    this.rolesAprobacion = {
      [environment.ROL.JEFE]: configJefe,
      [environment.ROL.JEFE_DEPENDENCIA]: configAuditado,
      [environment.ROL.ASISTENTE_DEPENDENCIA]: configAuditado,
    };
  }

  mostrarAcciones(): boolean {
    const condicionesVisibilidad: { [key: string]: number[] } = this.estadoAuditoriaId >= environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL
      ? {
        [environment.ROL.JEFE]: [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_INFORME_FINAL_JEFE],
      }
      : {
        [environment.ROL.JEFE]: [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE],
        [environment.ROL.JEFE_DEPENDENCIA]: [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO],
        [environment.ROL.ASISTENTE_DEPENDENCIA]: [environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO],
      };
    return condicionesVisibilidad[this.role!]?.includes(this.estadoAuditoriaId) || false;
  }

  async descargarTodo() {
    try {
      await this.descargaService.descargarMultiplesArchivos(this.documentos, "documentos.zip");
    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error);
    }
  }
}
