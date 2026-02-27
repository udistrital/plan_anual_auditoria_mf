import { Component } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { environment } from "src/environments/environment";
import { ModalMotivosRechazoComponent } from "../revision-jefe/modal-motivos-rechazo/modal-motivos-rechazo.component";
import { ModalAprobacionSecretarioComponent } from "./modal-aprobacion-secretario/modal-aprobacion-secretario.component";
import { ActivatedRoute, Router } from "@angular/router";
import { lastValueFrom } from 'rxjs';
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { UserService } from "src/app/core/services/user.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { TercerosService } from "src/app/shared/services/terceros.service";
import { RolService } from "src/app/core/services/rol.service";
import rolRemitentePorRol from "src/app/shared/utils/rolRemitentePorRol";

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
  roles: string[] = [];

  constructor(
    public dialog: MatDialog,
    private planAuditoriaService: PlanAnualAuditoriaService,
    private referenciaPdfService: ReferenciaPdfService,
    private nuxeoService: NuxeoService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private descargaService: DescargaService,
    private tercerosService: TercerosService,
    private rolService: RolService,
  ) { }

  botonSeleccionado: string = "formato";
  documentos: { base64: string; tipo_id: number }[] = [];
  documentoPAA: string = "";
  documentoMatrizPublica: string = "";
  usuarioId: any;

  async ngOnInit() {
    this.planAuditoriaId = this.route.snapshot.paramMap.get("id") || "";
    this.roles = this.rolService.getRoles();
    this.obtenerEstadoActual();
    try {
      await this.renderizarDocumentos();
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
      .subscribe({
        next: (response: any) => {
          const estadoActual = response?.Data?.[0];
          this.estadoIdActual = estadoActual?.estado_id || null;
          this.mostrarBotones =
            this.estadoIdActual === environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID;
        },
        error: (error) => {
          console.error("Error al obtener el estado actual:", error);
          this.mostrarBotones = false;
        }
      });
  }

  abrirModalRechazo(): void {
    if (!this.mostrarBotones) return;

    // Obtener nombre del secretario autenticado para pasarlo al modal
    this.tercerosService.getAuthenticatedUserTerceroIdentification().subscribe({
      next: (tercero) => {
        this.dialog.open(ModalMotivosRechazoComponent, {
          width: "50%",
          data: {
            usuarioId: this.usuarioId,
            planAuditoriaId: this.planAuditoriaId,
            rolRemitente: rolRemitentePorRol[this.roles[0]] || "Secretario Auditor",
            nombreRemitente: tercero.NombreCompleto,
            vigencia: null,
          },
        });
      },
      error: (err) => {
        console.warn("Error obteniendo datos del Secretario para el modal:", err);
        // Abrir modal igualmente sin nombre del remitente
        this.dialog.open(ModalMotivosRechazoComponent, {
          width: "50%",
          data: {
            usuarioId: this.usuarioId,
            planAuditoriaId: this.planAuditoriaId,
            rolRemitente: rolRemitentePorRol[this.roles[0]] || "Secretario Auditor",
            nombreRemitente: "Secretario Auditor",
            vigencia: null,
          },
        });
      }
    });
  }

  abrirModalEnviar(): void {
    if (!this.mostrarBotones) return;
    this.dialog.open(ModalAprobacionSecretarioComponent, {
      width: "600px",
      data: {
        usuarioId: this.usuarioId,
        usuarioRol: environment.ROL.SECRETARIO,
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

  async renderizarDocumentos() {
    try {
      const tipoIdPAA = environment.TIPO_DOCUMENTO_PARAMETROS.PLAN_ANUAL_AUDITORIA_ORIGINAL; 
      const tipoIdMatrizPublica = environment.TIPO_DOCUMENTO_PARAMETROS.MATRIZ_FUNCION_PUBLICA;

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
    try {
      await this.descargaService.descargarMultiplesArchivos(this.documentos, 'documentosPAA.zip');
    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error);
    }
  }
}
