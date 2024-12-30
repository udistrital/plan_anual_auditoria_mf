import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ModalMotivosRechazoComponent } from "./modal-motivos-rechazo/modal-motivos-rechazo.component";
import { UserService } from "src/app/core/services/user.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { GestorDocumentalService } from "src/app/core/services/gestor-documental.service";
import {ActivatedRoute, Router } from "@angular/router";
import { lastValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";

@Component({
  selector: "app-revision-jefe",
  templateUrl: "./revision-jefe.component.html",
  styleUrls: ["./revision-jefe.component.css"],
})

export class RevisionJefeComponent implements OnInit {
  selectedTab: number = 0;
  botonSeleccionado: string = "formato";
  documento: string = "";
  documentoMatrizPublica: string = "";
  usuarioId: any;
  planAuditoriaId: string = "";
  estadoIdActual: number | null = null;
  mostrarBotones: boolean = true; 

  constructor(
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private alertService: AlertService,
    private planAuditoriaService: PlanAnualAuditoriaService,
    private referenciaPdfService: ReferenciaPdfService,
    private nuxeoService: NuxeoService,
    private userService: UserService,
    private router: Router,
  ) {}

  async ngOnInit() {

    this.planAuditoriaId = this.route.snapshot.paramMap.get("id") || "";
    this.obtenerEstadoActual();
     try{
      this.documento = await this.renderDocumento(0);
      this.documentoMatrizPublica= await this.renderDocumento(0);
    }catch(error){
      console.log("no se genero el base 64");
    }
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
    });
  }

  obtenerEstadoActual(): void {
    this.planAuditoriaService
      .get(`estado?query=plan_auditoria_id:${this.planAuditoriaId},actual:true`)
      .subscribe(
        (response: any) => {
          const estadoActual = response?.Data?.[0]; 
          this.estadoIdActual = estadoActual?.estado_id || null;
          this.mostrarBotones =
            this.estadoIdActual === environment.PLAN_ESTADO.EN_REVISION_JEFE_ID;
        },
        (error) => {
          console.error("Error al obtener el estado actual:", error);
          this.mostrarBotones = false; 
        }
      );
  }

  abrirModalRechazo(): void {
    if (!this.mostrarBotones) return;

    this.dialog.open(ModalMotivosRechazoComponent, {
      width: "50%",
      data: {
        usuarioId: this.usuarioId,
        planAuditoriaId: this.planAuditoriaId,
      },
    });
  }

  abrirModalEnviar(): void {
    if (!this.mostrarBotones) return;

    this.alertService
      .showConfirmAlert(
        "¿Está seguro de enviar el Plan Anual de Auditoría? - PAA?"
      )
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }
        this.aprobarPlanAuditoria();
        
      });
  }


  aprobarPlanAuditoria() {
    const planEstado = this.construirObjetoPlanEstado(
      this.planAuditoriaId,
      environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID
    );
  
    this.planAuditoriaService.post("estado", planEstado).subscribe(
      () => {
        this.alertService.showSuccessAlert(
          "Plan aceptado, el plan fue enviado al secretario."
        );
        this.router.navigate([
          `/programacion/plan-auditoria/`
        ]);
      },
      (error) => {
        this.alertService.showErrorAlert(
          "Error al asociar el nuevo estado al plan."
        );
        console.error(error);
      }
    );
  }

  construirObjetoPlanEstado(planId: string, estadoId: number, observacion = "") {
    return {
      plan_auditoria_id: planId,
      usuario_id: this.usuarioId,
      observacion,
      estado_id: estadoId,
    };
  }

  selectTab(index: number) {
    this.selectedTab = index;
  }

  regresarRuta() {
    this.router.navigate([`/programacion/plan-auditoria`]);
  }

  async renderDocumento(tipoId: number): Promise<string> {
    try {
      const enlace = await lastValueFrom(
        this.referenciaPdfService.consultarDocumento(this.planAuditoriaId, tipoId)
      );
      const base64 = await this.nuxeoService.getByUUID(enlace);
      return base64;
    } catch (error) {
      console.error(`Error al renderizar el documento para tipoId ${tipoId}:`, error);
      return ""; 
    }
  }
  
}
/*
export function documento() {
  return "";
}*/
