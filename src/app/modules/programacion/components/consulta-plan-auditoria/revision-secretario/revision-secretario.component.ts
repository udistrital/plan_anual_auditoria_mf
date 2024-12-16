import { Component } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { AlertService } from "src/app/shared/services/alert.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { GestorDocumentalService } from "src/app/core/services/gestor-documental.service";
import { UserService } from "src/app/core/services/user.service";
import { environment } from "src/environments/environment";
import { ModalMotivosRechazoComponent } from "../revision-jefe/modal-motivos-rechazo/modal-motivos-rechazo.component";
import { ModalAprobacionSecretarioComponent } from "./modal-aprobacion-secretario/modal-aprobacion-secretario.component";
import { ActivatedRoute, Router } from "@angular/router";
import { lastValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";

@Component({
  selector: "app-revision-secretario",
  templateUrl: "./revision-secretario.component.html",
  styleUrl: "./revision-secretario.component.css",
})

export class RevisionSecretarioComponent {
  selectedTab: number = 0;

  planAuditoriaId: string = "";
  estadoIdActual: number | null = null;
  mostrarBotones: boolean = true;

  constructor(
    public dialog: MatDialog,
    private alertService: AlertService,
    private planAuditoriaService: PlanAnualAuditoriaService,
    private referenciaPdfService: ReferenciaPdfService,
    private nuxeoService: NuxeoService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,

  ) { }

  botonSeleccionado: string = "formato";
  documento: string = "";
  documentoMatrizPublica: string = "";
  usuarioId: any;

  async ngOnInit() {
    // Asigna el Base64 a la variable, incluyendo el prefijo del tipo de archivo.
    this.planAuditoriaId = this.route.snapshot.paramMap.get("id") || "";
    this.obtenerEstadoActual();
    try {
      this.documento = await this.renderDocumento(0);
      this.documentoMatrizPublica = await this.renderDocumento(1);
    } catch (error) {
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
          console.log(response?.Data)
          console.log(this.planAuditoriaId)
          this.estadoIdActual = estadoActual?.estado_id || null;
          this.mostrarBotones =
            this.estadoIdActual === environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID;
        },
        (error) => {
          console.error("Error al obtener el estado actual:", error);
          this.mostrarBotones = false;
        }
      );
  }

  openModalRechazo(): void {
    if (!this.mostrarBotones) return;

    this.dialog.open(ModalMotivosRechazoComponent, {
      width: "50%",
      data: {
        usuarioId: this.usuarioId,
        planAuditoriaId: this.planAuditoriaId,
      },
    });
  }

  openModalEnviar(): void {
    if (!this.mostrarBotones) return;

    this.dialog.open(ModalAprobacionSecretarioComponent, {
      width: "600px",
      data: {
        usuarioId: this.usuarioId,
        planAuditoriaId: this.planAuditoriaId,
      },
    });
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
  const base64 = consultarNuexo();
  return base64;
}*/