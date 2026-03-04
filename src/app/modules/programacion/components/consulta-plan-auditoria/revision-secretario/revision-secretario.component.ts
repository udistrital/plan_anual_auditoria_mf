import { Component } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { environment } from "src/environments/environment";
import { ModalMotivosRechazoComponent } from "../revision-jefe/modal-motivos-rechazo/modal-motivos-rechazo.component";
import { ModalAprobacionSecretarioComponent } from "./modal-aprobacion-secretario/modal-aprobacion-secretario.component";
import { ActivatedRoute, Router } from "@angular/router";
import { lastValueFrom, forkJoin } from 'rxjs';
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { UserService } from "src/app/core/services/user.service";
import { NuxeoService } from "src/app/core/services/nuxeo.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { DescargaService } from "src/app/shared/services/descarga.service";
import { TercerosService } from "src/app/shared/services/terceros.service";
import { RolService } from "src/app/core/services/rol.service";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import rolRemitentePorRol from "src/app/shared/utils/rolRemitentePorRol";
import { DocumentoUtils, REFRESHABLES } from "../consulta-plan.auditoria.utils";
import { TabDocumento } from "src/app/shared/elements/components/dialogs/modal-ver-documentos/modal-ver-documentos.component";

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
    private planAuditoriaService: PlanAnualAuditoriaService,
    private referenciaPdfService: ReferenciaPdfService,
    private nuxeoService: NuxeoService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private descargaService: DescargaService,
    private tercerosService: TercerosService,
    private rolService: RolService,
    private parametrosUtilsService: ParametrosUtilsService,
    private documentoUtils: DocumentoUtils,
  ) { }

  botonSeleccionado: string = "formato";
  documentos: { base64: string; tipo_id: number }[] = [];
  documentosPorTab: { [key: number]: string } = {};
  tabs: TabDocumento[] = [];
  roles: string[] = [];
  usuarioId: any;
  vigenciaNombre: string = "";
  roles: string[] = [];

  async ngOnInit() {
    console.debug("Inicializando RevisionSecretarioComponent...");
    this.planAuditoriaId = this.route.snapshot.paramMap.get("id") || "";
    this.roles = this.rolService.getRoles();
    this.obtenerVigenciaActual();
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

  obtenerVigenciaActual(): void {
    forkJoin({
      plan: this.planAuditoriaService.get(`plan-auditoria/${this.planAuditoriaId}`),
      vigencias: this.parametrosUtilsService.getVigencias(),
    }).subscribe({
      next: ({ plan, vigencias }: any) => {
        const vigenciaId = plan?.Data?.vigencia_id;
        const vigenciaNombre = vigencias?.find((v: any) => v.Id === vigenciaId)?.Nombre || "";
        this.vigenciaNombre = vigenciaNombre || "";
      },
      error: (error) => {
        console.error("Error al obtener la vigencia:", error);
      }
    });
  }

  obtenerEstadoActual(): void {
    const callbacks = {
      [REFRESHABLES.FORMATO_PAA_ACTUALIZADO]: () =>
        this.renderizarDocumentos(),
    };
    this.planAuditoriaService
      .get(`estado?query=plan_auditoria_id:${this.planAuditoriaId},actual:true`)
      .subscribe({
        next: (response: any) => {
          const estadoActual = response?.Data?.[0];
          this.estadoIdActual = estadoActual?.estado_id || null;
          this.mostrarBotones =
              this.estadoIdActual === environment.PLAN_ESTADO.EN_REVISION_SECRETARIO_ID;

          this.tabs = this.documentoUtils.getTabsVerDocumentos(this.planAuditoriaId, this.estadoIdActual || 0, this.roles, callbacks);
        },
        error: (error) => {
          console.error("Error al obtener el estado actual:", error);
          this.mostrarBotones = false;
          this.tabs = this.documentoUtils.getTabsVerDocumentos(this.planAuditoriaId, 0, this.roles, callbacks);
        }
      });
  }

  abrirModalRechazo(): void {
    if (!this.mostrarBotones) return;

    this.tercerosService.getAuthenticatedUserTerceroIdentification().subscribe({
      next: (tercero) => {
        this.dialog.open(ModalMotivosRechazoComponent, {
          width: "50%",
          data: {
            usuarioId: this.usuarioId,
            planAuditoriaId: this.planAuditoriaId,
            rolRemitente: "Secretario Auditor",
            nombreRemitente: tercero.NombreCompleto,
            vigencia: null,
          },
        });
      },
      error: (err) => {
        console.warn("Error obteniendo datos del Secretario para el modal:", err);
        this.dialog.open(ModalMotivosRechazoComponent, {
          width: "50%",
          data: {
            usuarioId: this.usuarioId,
            planAuditoriaId: this.planAuditoriaId,
            rolRemitente: "Secretario Auditor",
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
      this.documentos = [];
      this.documentosPorTab = {};

      const enlacesConTipo = await lastValueFrom(
        this.referenciaPdfService.consultarDocumentos(this.planAuditoriaId)
      );

      const enlaces = enlacesConTipo.map((doc) => doc.nuxeo_enlace);
      const base64Files = await this.nuxeoService.obtenerPorUUIDs(enlaces);

      enlacesConTipo.forEach((doc, index) => {
        const base64 = base64Files[index];
        this.documentos.push({ base64, tipo_id: doc.tipo_id });
      });

      const tabHolders = this.tabs.map((tab, i) => ({ idx: i, tab: tab }));
      this.documentos.forEach((doc) => {
        const holderIdx = tabHolders.findIndex(holder => holder.tab.tipoId === doc.tipo_id);
        if (holderIdx !== -1) {
          this.documentosPorTab[tabHolders[holderIdx].idx] = doc.base64;
          tabHolders.splice(holderIdx, 1);
        }
      });

    } catch (error) {
      console.error("Error al renderizar los documentos:", error);
    }
  }

  async descargarTodo() {
    try {
      const suffix = this.vigenciaNombre ? `-${this.vigenciaNombre.replace(/\s+/g, '-')}` : '';
      await this.descargaService.descargarMultiplesArchivos(
        this.documentos,
        `documentosPAA${suffix}.zip`,
        suffix
      );
    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error);
    }
  }
}
