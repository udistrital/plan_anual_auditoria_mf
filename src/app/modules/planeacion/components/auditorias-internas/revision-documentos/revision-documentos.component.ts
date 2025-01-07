import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
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
  selectedTab: number = 0;
  usuarioId: any;
  role: string | null = null;
  opcionesDocumentos: any;
  rolesAprobacion: any;

  constructor(
    public dialog: MatDialog,
    private autenticationService: ImplicitAutenticationService,
    private router: Router,
    private userService: UserService,
    private alertService: AlertService,
    private planAuditoriaService: PlanAnualAuditoriaService
  ) {}

  ngOnInit(): void {
    this.opcionesDocumentos = documentos;
    this.rolesAprobacion = rolesAprobacion;
    this.buscarRol();
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
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
        this.aprobarPlanAuditoria(estadoAprobacion, mensajeAprobacion);
      });
  }

  aprobarPlanAuditoria(estadoAprobacion: number, mensajeAprobacion: string) {
    const auditoriaEstado =
      this.construirObjetoAuditoriaEstado(estadoAprobacion);

    this.planAuditoriaService
      .post("auditoria-estado", auditoriaEstado)
      .subscribe(
        () => {
          this.alertService.showSuccessAlert(
            mensajeAprobacion,
            "Auditoria enviada"
          );
          this.router.navigate([`/planeacion/auditorias-internas/`]);
        },
        (error) => {
          this.alertService.showErrorAlert("Error al aprobar el plan.");
        }
      );
  }

  construirObjetoAuditoriaEstado(estadoAprobacion: number) {
    return {
      //todo: id quemado
      auditoria_id: "675b369a4c36a9bb93228a7e",
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
        //todo: id quemado
        auditoriaId: "675b369a4c36a9bb93228a7e",
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
}
