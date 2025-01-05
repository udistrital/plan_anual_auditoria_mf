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

    //Para aprobar segun el rol
    if (rolAprobacion) {
      const estadoAprobacion = rolAprobacion.estadoAprobacion;
      const mensajeAprobacion = rolAprobacion.mensajeAprobacion;

      this.alertService
        .showConfirmAlert(mensajeAprobacion)
        .then((confirmado) => {
          if (!confirmado.value) {
            return;
          }
          this.aprobarPlanAuditoria(estadoAprobacion);
        });
    }
  }

  aprobarPlanAuditoria(estadoAprobacion: number) {
    const planEstado = this.construirObjetoPlanEstado();

    this.planAuditoriaService.post("estado", planEstado).subscribe(
      () => {
        this.alertService.showSuccessAlert(
          "Plan aceptado, el plan fue enviado al auditado responsable."
        );
        this.router.navigate([`/planeacion/auditorias-internas/`]);
      },
      (error) => {
        this.alertService.showErrorAlert("Error al aprobar el plan.");
      }
    );
  }

  construirObjetoPlanEstado() {
    return {};
  }

  abrirModalRechazo(): void {
    this.dialog.open(ModalRechazoAuditoriaComponent, {
      width: "50%",
      data: {
        usuarioId: this.usuarioId,
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
