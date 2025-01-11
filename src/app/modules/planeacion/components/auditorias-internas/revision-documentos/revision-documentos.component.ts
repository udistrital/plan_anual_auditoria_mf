import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { UserService } from "src/app/core/services/user.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { ModalRechazoAuditoriaComponent } from "./modal-rechazo-auditoria/modal-rechazo-auditoria.component";
import { MatDialog } from "@angular/material/dialog";
import { ImplicitAutenticationService } from "src/app/core/services/implicit_autentication.service";
import { environment } from "src/environments/environment";
import { documentos, rolesAprobacion } from "./revision-documentos.utilidades";

@Component({
  selector: "app-revision-documentos",
  templateUrl: "./revision-documentos.component.html",
  styleUrl: "./revision-documentos.component.css",
})
export class RevisionDocumentosComponent implements OnInit {
  auditoriaId: string = "";
  estadoAuditoriaId!: number;
  selectedTab: number = 0;
  opcionesDocumentos: any;
  role: string | null = null;
  rolauditoriaIdesAprobacion: any;
  rolesAprobacion: any;
  usuarioId: any;

  constructor(
    public dialog: MatDialog,
    private alertService: AlertService,
    private autenticationService: ImplicitAutenticationService,
    private planAuditoriaService: PlanAnualAuditoriaService,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.inicializarDatos();
    this.cargarEstadoAuditoria();
  }

  inicializarDatos() {
    this.auditoriaId = this.route.snapshot.paramMap.get("id")!;
    this.opcionesDocumentos = documentos;
    this.rolesAprobacion = rolesAprobacion;
    this.buscarRol();
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
    });
  }

  cargarEstadoAuditoria() {
    this.planAuditoriaService
      .get(
        `auditoria-estado?query=auditoria_id:${this.auditoriaId},actual:true`
      )
      .subscribe((res) => {
        this.estadoAuditoriaId =
          res.Data[0]?.estado_id ?? environment.AUDITORIA_ESTADO.BORRADOR_ID;
        console.log(this.estadoAuditoriaId);
      });
  }

  preguntarAprobacionAuditoria() {
    const rolAprobacion = this.rolesAprobacion[this.role!];

    if (!rolAprobacion) {
      return; //si no hay rol
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
          // Si es un array como en el caso del rol jefe, para hacer dos post para el flujo de estados
          this.aprobarAuditoriaSecuencial(estadoAprobacion, mensajeAprobacion);
        } else {
          this.aprobarAuditoria(estadoAprobacion, mensajeAprobacion);
        }
      });
  }

  //funcion para registrar estados de auditoria secuencialmente,
  async aprobarAuditoriaSecuencial(
    estadoAprobacion: number[],
    mensajeAprobacion: string
  ) {
    try {
      for (const estado of estadoAprobacion) {
        await this.aprobarAuditoria(estado, mensajeAprobacion);
      }
    } catch (error) {
      this.alertService.showErrorAlert("Error al aprobar el plan.");
    }
  }

  async aprobarAuditoria(estadoAprobacion: number, mensajeAprobacion: string) {
    try {
      const auditoriaEstado =
        this.construirObjetoAuditoriaEstado(estadoAprobacion);

      await this.planAuditoriaService
        .post("auditoria-estado", auditoriaEstado)
        .toPromise();

      this.alertService.showSuccessAlert(
        mensajeAprobacion,
        "Auditoria enviada"
      );
      this.router.navigate([`/planeacion/auditorias-internas/`]);
    } catch (error) {
      this.alertService.showErrorAlert("Error al aprobar el plan.");
    }
  }

  construirObjetoAuditoriaEstado(estadoAprobacion: number) {
    return {
      auditoria_id: this.auditoriaId,
      usuario_id: this.usuarioId,
      usuario_rol: this.role,
      observacion: "",
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

  mostrarAcciones(role: string, estadoAuditoriaId: number): boolean {
    const condicionesVisibilidad: { [key: string]: number[] } = {
      jefe: [environment.AUDITORIA_ESTADO.EN_REVISION_POR_JEFE_ID],
      auditado: [environment.AUDITORIA_ESTADO.EN_REVISIÓN_POR_AUDITADO_ID],
    };
    // retorna true, si el rol coincide con el estado de revision del rol
    return condicionesVisibilidad[role]?.includes(estadoAuditoriaId) || false;
  }
}
