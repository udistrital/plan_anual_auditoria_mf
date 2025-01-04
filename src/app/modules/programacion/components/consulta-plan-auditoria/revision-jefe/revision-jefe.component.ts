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
import { switchMap } from 'rxjs/operators';
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import * as JSZip from 'jszip'; 
import { saveAs } from 'file-saver'; 

@Component({
  selector: "app-revision-jefe",
  templateUrl: "./revision-jefe.component.html",
  styleUrls: ["./revision-jefe.component.css"],
})

export class RevisionJefeComponent implements OnInit {
  selectedTab: number = 0;
  botonSeleccionado: string = "formato";
  documentos: { base64: string; tipo_id: number }[] = [];
  documentoPAA: string = "";
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
      await this.renderizarDocumentos();
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
    const planEstadoAprobadoJefe = this.construirObjetoPlanEstado(
        this.planAuditoriaId,
        environment.PLAN_ESTADO.APROBADO_JEFE_ID
    );

    const planEstadoRevisionSecretario = this.construirObjetoPlanEstado(
        this.planAuditoriaId,
        environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID
    );

    this.planAuditoriaService.post("estado", planEstadoAprobadoJefe)
        .pipe(
            switchMap(() =>
                this.planAuditoriaService.post("estado", planEstadoRevisionSecretario)
            )
        )
        .subscribe({
            next: () => {
                this.alertService.showSuccessAlert(
                    "Plan aceptado, el plan fue enviado al secretario."
                );
                this.router.navigate([`/programacion/plan-auditoria/`]);
            },
            error: (error) => {
                this.alertService.showErrorAlert(
                    "Error al asociar los estados al plan."
                );
                console.error(error);
            }
        });
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

  async renderizarDocumentos() {
    try {
      const tipoIdPAA = environment.TIPO_DOCUMENTO_PARAMETOS.PLAN_ANUAL_AUDITORIA; 
      const tipoIdMatrizPublica = environment.TIPO_DOCUMENTO_PARAMETOS.MATRIZ_FUNCION_PUBLICA;

      const enlacesConTipo = await lastValueFrom(
        this.referenciaPdfService.consultarDocumentos(this.planAuditoriaId)
      );

      const enlaces = enlacesConTipo.map((doc) => doc.nuxeo_enlace);
      const base64Files = await this.nuxeoService.obtenerPorUUIDs(enlaces);

      enlacesConTipo.forEach((doc, index) => {
        const base64 = base64Files[index];
        this.documentos.push({ base64, tipo_id: doc.tipo_id });

        if (doc.tipo_id === tipoIdPAA && !this.documentoPAA) {
          this.documentoPAA = base64;
        }
        if (doc.tipo_id === tipoIdMatrizPublica && !this.documentoMatrizPublica) {
          this.documentoMatrizPublica = base64;
        }
      });

    } catch (error) {
      console.error("Error al renderizar los documentos:", error);
    }
  }

  async descargarTodo() {
    const zip = new JSZip();
    const tipoIdPAA = environment.TIPO_DOCUMENTO_PARAMETOS.PLAN_ANUAL_AUDITORIA; 
    const tipoIdMatrizPublica = environment.TIPO_DOCUMENTO_PARAMETOS.MATRIZ_FUNCION_PUBLICA;

    try {
      this.documentos.forEach((doc, index) => {
        let fileName = `documento_${index + 1}.pdf`;

        // Nombres específicos según tipo_id
        if (doc.tipo_id === tipoIdPAA) {
          fileName = `plan_anual_auditoria.pdf`;
        } else if (doc.tipo_id === tipoIdMatrizPublica) {
          fileName = `matriz_funcion_publica.pdf`;
        }

        zip.file(fileName, doc.base64, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "documentosPAA.zip");
    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error);
    }
  }
  
}
/*
export function documento() {
  return "";
}*/
