import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { colocacionesContructorTabla } from "./tabla-auditorias-internas.utilidades";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { Auditoria } from "src/app/shared/data/models/auditoria";
import { ModalHistorialRechazosComponent } from "../modal-historial-rechazos/modal-historial-rechazos.component";
import { ModalAmpliarRevisionAuditadoComponent } from "../modal-ampliar-revision-auditado/modal-ampliar-revision-auditado.component";
import { AlertService } from "src/app/shared/services/alert.service";
import { RolService } from "src/app/core/services/rol.service";
import { UserService } from "src/app/core/services/user.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { accionesEjecucionFinal, accionesEjecucionPreliminar } from "src/app/shared/utils/accionesPorRolYEstado";
import { environment } from "src/environments/environment";

@Component({
    selector: "app-tabla-auditorias-internas",
    templateUrl: "./tabla-auditorias-internas.component.html",
    styleUrls: ["./tabla-auditorias-internas.component.css"],
    standalone: false
})
export class TablaAuditoriasInternasComponent implements OnInit {
  @Input() vigenciaId: any;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  auditoriasDataSource: MatTableDataSource<any> = new MatTableDataSource();
  auditoriasPorVigencia: Auditoria[] = [];
  auditoriasContructorTabla: any;
  banderaTablaAuditoriasInternas: boolean = false;
  tablaColumnas: any;
  roles: string[] = [];
  totalRegistros: number = 0;
  pageSize: number = 5;
  pageIndex: number = 0;
  itemsPerPage: number[] = [5, 10, 20];
  mostrarAcciones: boolean = false;
  tipoConsulta: 'general' | 'auditor' | 'auditado' = 'general';
  personaId: number = 0;
  cargoId: number = 0;
  iconosAccion = new Map<string, string>([
    ["Editar Preinforme", "edit_note"],
    ["Editar Informe", "edit"],
    ["Ver Preinforme", "visibility"],
    ["Ver Informe", "visibility"],
    ["Ver Documentos del informe", "description"],
    ["Enviar a Aprobación por Jefe", "send"],
    ["Historial de Observaciones", "history"],
    ["Ampliar tiempo de revisión auditado", "more_time"],
  ]);

  constructor(
    private readonly alertaService: AlertService,
    private readonly rolService: RolService,
    private readonly userService: UserService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly router: Router,
    private readonly dialog: MatDialog
  ) { }

  async ngOnInit() {
    this.roles = this.rolService.getRoles();
    this.setPermisos();
    await this.configurarTipoConsulta();
  }

  setPermisos() {
    if (this.rolService.mostrarAcciones(accionesEjecucionPreliminar) || this.rolService.mostrarAcciones(accionesEjecucionFinal)) {
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
    } else if (
      this.rolService.tieneRol(environment.ROL.AUDITOR) ||
      this.rolService.tieneRol(environment.ROL.AUDITOR_ASISTENTE) ||
      this.rolService.tieneRol(environment.ROL.AUDITOR_EXPERTO)
    ) {
      this.tipoConsulta = 'auditor';
      this.personaId = await this.userService.getPersonaId();
    }
    // ADMIN, AUDITOR_EXPERTO, JEFE → tipoConsulta = 'general' (default)
  }

  listarAuditoriasPorVigencia(vigenciaId: number, limit: number = this.itemsPerPage[0], offset: number = 0) {
    this.auditoriasPorVigencia = [];
    const queryBase = `query=vigencia_id:${vigenciaId},activo:true,tipo_evaluacion_id:${environment.TIPO_EVALUACION.AUDITORIA_INTERNA_ID},estado_id__gte:${environment.AUDITORIA_ESTADO.EJECUCION.POR_EJECUTAR}&limit=${limit}&offset=${offset}`;
    let url: string;
    switch (this.tipoConsulta) {
      case 'auditado':
        url = `auditoria/auditado/${this.personaId}/${this.cargoId}?${queryBase}`;
        break;
      case 'auditor':
        url = `auditoria/auditor/${this.personaId}?${queryBase}`;
        break;
      default:
        url = `auditoria?${queryBase}`;
        break;
    }

    this.planAuditoriaMid
      .get(url)
      .subscribe((res) => {
        const auditorias: any[] = res.Data.map((auditoria: any) => {
          const estadoId = auditoria.estado?.estado_id || auditoria.estado_id;
          const acciones = this.getAccionesPorRolYEstado(estadoId);
          return { ...auditoria, acciones };
        });

        if (auditorias.length === 0) {
          this.banderaTablaAuditoriasInternas = false;
          this.auditoriasDataSource.data = [];
          return this.alertaService.showAlert(
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

  getAccionesPorRolYEstado(estado: number) {
    const mostrarComoInforme = estado >= environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL;

    const acciones = this.roles.flatMap((rol) => {
      if (mostrarComoInforme) {
        return accionesEjecucionFinal[rol]?.[estado] ?? [];
      } else {
        return accionesEjecucionPreliminar[rol]?.[estado] ?? [];
      }
    });

    const accionesUnicas = Array.from(new Set(acciones));

    // En REVISION_PREINFORME_AUDITADO el auditado entra únicamente por "Ver Documentos del informe"
    const esAuditado = this.roles.some(r =>
      r === environment.ROL.JEFE_DEPENDENCIA || r === environment.ROL.ASISTENTE_DEPENDENCIA
    );
    if (esAuditado && estado === environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_AUDITADO) {
      return accionesUnicas.filter(a => a !== 'Editar Preinforme');
    }

    return accionesUnicas;
  }

  getIconoAccion(accion: string): string {
    return this.iconosAccion.get(accion) ?? "help";
  }

  realizarAccion(auditoria: any, accion: string) {
    const acciones: Record<string, Function | null> = {
      "Editar Preinforme": () => this.editarInforme(auditoria),
      "Editar Informe": () => this.editarInforme(auditoria),
      "Ver Preinforme": () => this.verInformeSoloLectura(auditoria),
      "Ver Informe": () => this.verInformeSoloLectura(auditoria),
      "Ver Documentos del informe": () => this.verDocumentosInforme(auditoria),
      "Enviar a Aprobación por Jefe": () => this.enviarAprobacionPorJefe(auditoria),
      "Historial de Observaciones": () => this.abrirHistorialObservaciones(auditoria),
      "Ampliar tiempo de revisión auditado": () => this.abrirModalAmpliarRevision(auditoria),
    };
    acciones[accion]?.();
  }

  abrirHistorialObservaciones(auditoria: Auditoria) {
    this.dialog.open(ModalHistorialRechazosComponent, {
      data: { auditoriaId: auditoria._id },
      width: "1000px",
    });
  }

  async abrirModalAmpliarRevision(auditoria: Auditoria) {
    const usuarioId = await this.userService.getPersonaId();
    this.planAuditoriaService
      .get(`informe?query=auditoria_id:${auditoria._id},activo:true`)
      .subscribe({
        next: (res: any) => {
          const informe = res?.Data?.[0];
          if (!informe || !informe.fecha_fin_revision) {
            this.alertaService.showErrorAlert("No se encontró el informe o la fecha de revisión del auditado.");
            return;
          }
          this.dialog.open(ModalAmpliarRevisionAuditadoComponent, {
            width: "500px",
            data: {
              informeId: informe._id,
              fechaFinRevision: informe.fecha_fin_revision,
              diasRevision: informe.dias_revision ?? 3,
              usuarioId,
            },
          });
        },
        error: () => this.alertaService.showErrorAlert("Error al buscar el informe."),
      });
  }

  editarInforme(auditoria: Auditoria) {
    this.obtenerOCrearInforme(auditoria._id, (informeId) => {
      this.router.navigate([`/ejecucion/auditorias-internas/editar-informe/${informeId}`]);
    });
  }

  verInformeSoloLectura(auditoria: Auditoria) {
    this.planAuditoriaService.get(`informe?query=auditoria_id:${auditoria._id},activo:true`).subscribe({
      next: (res: any) => {
        if (res?.Data?.length > 0) {
          this.router.navigate(
            [`/ejecucion/auditorias-internas/editar-informe/${res.Data[0]._id}`],
            { queryParams: { soloLectura: true } }
          );
        } else {
          this.alertaService.showErrorAlert('No se encontró un informe para esta auditoría.');
        }
      },
      error: () => this.alertaService.showErrorAlert('Error al buscar el informe.')
    });
  }

  private obtenerOCrearInforme(auditoriaId: string, onInformeId: (informeId: string) => void) {
    this.planAuditoriaService.get(`informe?query=auditoria_id:${auditoriaId},activo:true`).subscribe({
      next: (res: any) => {
        if (res?.Data?.length > 0) {
          onInformeId(res.Data[0]._id);
        } else {
          this.planAuditoriaService.post('informe', { auditoria_id: auditoriaId }).subscribe({
            next: (informeCreado: any) => {
              this.crearEstadoCreandoPreinforme(auditoriaId, informeCreado.Data._id, onInformeId);
            },
            error: () => this.alertaService.showErrorAlert('Error al crear el informe.')
          });
        }
      },
      error: () => this.alertaService.showErrorAlert('Error al buscar el informe.')
    });
  }

  private async crearEstadoCreandoPreinforme(auditoriaId: string, informeId: string, onDone: (informeId: string) => void) {
    const usuarioId = await this.userService.getPersonaId();
    const role = this.rolService.getRolPrioritario([
      environment.ROL.AUDITOR_EXPERTO,
      environment.ROL.AUDITOR,
      environment.ROL.AUDITOR_ASISTENTE,
    ]);
    this.planAuditoriaService.post('auditoria-estado', {
      auditoria_id: auditoriaId,
      fase_id: environment.AUDITORIA_FASE.EJECUCION_PRELIMINAR,
      estado_id: environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_PREINFORME,
      usuario_id: usuarioId,
      usuario_rol: role,
      observacion: "",
    }).subscribe({
      next: () => onDone(informeId),
      error: () => {
        this.alertaService.showErrorAlert('Error al registrar el estado del informe.');
        onDone(informeId);
      }
    });
  }

  verDocumentosInforme(auditoria: Auditoria) {
    const auditoriaId = auditoria._id;
    this.router.navigate([`/ejecucion/auditorias-internas/revision/${auditoriaId}`]);
  }

  enviarAprobacionPorJefe(auditoria: Auditoria) {
    const estadoId = (auditoria as any).estado?.estado_id || (auditoria as any).estado_id;
    const esFlujoFinal = estadoId >= environment.AUDITORIA_ESTADO.EJECUCION.CREANDO_INFORME_FINAL;

    const validacion = esFlujoFinal
      ? this.validarInformeFinal.bind(this)
      : this.validarInformePreliminar.bind(this);

    validacion(auditoria._id, async () => {
      const confirmado = await this.alertaService.showConfirmAlert(
        esFlujoFinal
          ? "¿Está seguro(a) de enviar el informe final para aprobación del Jefe?"
          : "¿Está seguro(a) de enviar el informe preliminar para aprobación del Jefe?"
      );
      if (!confirmado.value) return;

      // Solo los auditores pueden enviar a aprobación por jefe
      const usuarioId = await this.userService.getPersonaId();
      const role = this.rolService.getRolPrioritario([
        environment.ROL.AUDITOR_EXPERTO,
        environment.ROL.AUDITOR,
        environment.ROL.AUDITOR_ASISTENTE,
      ]);

      // Enviar a aprobación por jefe
      this.planAuditoriaService
        .post("auditoria-estado", {
          auditoria_id: auditoria._id,
          fase_id: esFlujoFinal
            ? environment.AUDITORIA_FASE.EJECUCION_FINAL
            : environment.AUDITORIA_FASE.EJECUCION_PRELIMINAR,
          estado_id: esFlujoFinal
            ? environment.AUDITORIA_ESTADO.EJECUCION.REVISION_INFORME_FINAL_JEFE
            : environment.AUDITORIA_ESTADO.EJECUCION.REVISION_PREINFORME_JEFE,
          usuario_id: usuarioId,
          usuario_rol: role,
          observacion: "",
        })
        .subscribe({
          next: () => {
            this.alertaService.showSuccessAlert(
              esFlujoFinal
                ? "El informe final fue enviado al Jefe para su aprobación."
                : "El informe fue enviado al Jefe para su aprobación.",
              "Informe enviado"
            );
            this.listarAuditoriasPorVigencia(this.vigenciaId);
          },
          error: () => {
            this.alertaService.showErrorAlert("Error al enviar el informe al Jefe.");
          },
        });
    });
  }

  // Valida que el informe preliminar exista antes de permitir enviar a aprobación por jefe
  private validarInformePreliminar(auditoriaId: string, onValido: () => void) {
    this.referenciaPdfService.consultarDocumentos(auditoriaId).subscribe(docs => {
      if (!docs.some(doc => doc.tipo_id === environment.TIPO_DOCUMENTO_PARAMETROS.INFORME_PRELIMINAR)) {
        this.alertaService.showErrorAlert(
          "Debe generar el informe preliminar antes de enviarlo al Jefe."
        );
        return;
      }
      onValido();
    });
  }

  // Valida que el informe final exista antes de permitir enviar a aprobación por jefe
  private validarInformeFinal(auditoriaId: string, onValido: () => void) {
    this.referenciaPdfService.consultarDocumentos(auditoriaId).subscribe(docs => {
      if (!docs.some(doc => doc.tipo_id === environment.TIPO_DOCUMENTO_PARAMETROS.INFORME_FINAL)) {
        this.alertaService.showErrorAlert(
          "Debe generar el informe final antes de enviarlo al Jefe."
        );
        return;
      }
      onValido();
    });
  }
}
