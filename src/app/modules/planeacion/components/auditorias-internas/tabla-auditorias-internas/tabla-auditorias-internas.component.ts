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
import { ImplicitAutenticationService } from "src/app/core/services/implicit_autentication.service";
import { environment } from "src/environments/environment";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { UserService } from "src/app/core/services/user.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";

@Component({
  selector: "app-tabla-auditorias-internas",
  templateUrl: "./tabla-auditorias-internas.component.html",
  styleUrl: "./tabla-auditorias-internas.component.css",
})
export class TablaAuditoriasInternasComponent implements OnInit {
  @Input() vigenciaId: any;
  @ViewChild(MatSort) sort!: MatSort;
  auditoriaEstados = environment.AUDITORIA_ESTADO;

  auditoriasPorVigencia: Auditoria[] = [];
  auditoriasDataSource: MatTableDataSource<any> = new MatTableDataSource();
  auditoriasContructorTabla: any;
  banderaTablaAuditoriasInternas: boolean = false;
  tablaColumnas: any;
  role: string | null = null;
  usuarioId: any;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  totalRegistros: number = 0;
  pageSize: number = 5;
  pageIndex: number = 0;
  itemsPerPage: number[] = [5, 10, 20];
  permisoEdicion: boolean = false;
  permisoConsulta: boolean = false;

  constructor(
    private readonly alertService: AlertService,
    private readonly autenticationService: ImplicitAutenticationService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly dialog: MatDialog,
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly nuxeoService: NuxeoService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly planAuditoriaService: PlanAnualAuditoriaService,
    private readonly router: Router,
    private readonly userService: UserService
  ) {}

  ngOnInit() {
    this.buscarRol();
    this.permisos();
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
    });
  }

  listarAuditoriasPorVigencia(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0
  ) {
    this.auditoriasPorVigencia = [];
    this.planAuditoriaMid
      .get(
        `auditoria?query=vigencia_id:${vigenciaId},activo:true&limit=${limit}&offset=${offset}`
      )
      .subscribe((res) => {
        const auditorias: any[] = res.Data;

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
        return column.columnDef !== "acciones" || this.permisoEdicion;
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

  cargarEstadoAuditoria(auditoria: Auditoria) {
    if (auditoria.estado_interno_id) {
      return;
    }

    const auditoriaId = auditoria._id;
    this.planAuditoriaService
      .get(`auditoria-estado?query=auditoria_id:${auditoriaId},actual:true`)
      .subscribe((res) => {
        auditoria.estado_interno_id =
          res.Data[0]?.estado_interno_id ?? this.auditoriaEstados.BORRADOR_ID;
      });
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
        this.enviarAprobacionPorJefe(auditoria._id);
        delete auditoria.estado_interno_id;
      });
  }

  enviarAprobacionPorJefe(auditoriaId: string) {
    const auditoriaEstado = this.construirObjetoAuditoriaEstado(auditoriaId);
    this.planAuditoriaService
      .post("auditoria-estado", auditoriaEstado)
      .subscribe(
        () => {
          this.alertService.showSuccessAlert(
            "Auditoria enviada a aprobación por Jefe",
            "Auditoria enviada"
          );
        },
        (error) => {
          this.alertService.showErrorAlert("Error al enviar el plan.");
        }
      );
  }

  construirObjetoAuditoriaEstado(auditoriaId: string) {
    return {
      auditoria_id: auditoriaId,
      usuario_id: this.usuarioId,
      usuario_rol: this.role,
      observacion: "",
      estado_interno_id: this.auditoriaEstados.EN_REVISION_POR_JEFE_ID,
      //todo por implementar
      estado_id: 0,
    };
  }

  buscarRol() {
    this.autenticationService.getRole().then((roles: any) => {
      if (!roles || roles.length === 0) {
        return;
      }
      console.log(roles);

      const esSecretario = roles.includes("SECRETARIO_AUDITOR");
      const esAuditor = roles.some(
        (role: string) => role === "AUDITOR_EXPERTO" || role === "AUDITOR"
      );
      const esJefe = roles.includes("JEFE_CONTROL_INTERNO");

      this.role = esSecretario
        ? "secretario"
        : esAuditor
        ? "auditor"
        : esJefe
        ? "jefe"
        : null;
    });
  }

  permisos() {
    this.autenticationService
      .getRole()
      .then((roles) => {
        this.permisoEdicion = this.autenticationService.PermisoEdicion(
          roles as string[]
        );
        console.log("Permiso de edición:", this.permisoEdicion);
        this.permisoConsulta = this.autenticationService.PermisoConsulta(
          roles as string[]
        );
        console.log("Permiso de consulta:", this.permisoConsulta);
      })
      .catch((error) => {
        console.error("Error al obtener los roles del usuario:", error);
      });
  }

  esEditableAuditoria(estadoId: number): boolean {
    return (
      estadoId === this.auditoriaEstados.RECHAZADO_ID ||
      estadoId === this.auditoriaEstados.BORRADOR_ID
    );
  }
}
