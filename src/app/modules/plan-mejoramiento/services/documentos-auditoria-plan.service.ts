import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { lastValueFrom, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { ReferenciaPdfService } from "src/app/core/services/referencia-pdf.service";
import { RolService } from "src/app/core/services/rol.service";
import { UserService } from "src/app/core/services/user.service";
import { tituloYSubtituloAuditoria } from "src/app/shared/data/models/auditoria";
import { ModalVerDocumentosComponent, TabDocumento } from "src/app/shared/elements/components/dialogs/modal-ver-documentos/modal-ver-documentos.component";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";

/**
 * Documentos de la auditoría para el Plan de Mejoramiento ("Ver Documentos Auditoría" de la bandeja
 * y "Ver Expediente Completo" de Ver Plan).
 */
@Injectable({ providedIn: "root" })
export class DocumentosAuditoriaPlanService {
  constructor(
    private readonly dialog: MatDialog,
    private readonly alertaService: AlertService,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly referenciaPdfService: ReferenciaPdfService,
    private readonly rolService: RolService,
    private readonly userService: UserService,
  ) {}

  async verDocumentosAuditoria(auditoria: any): Promise<void> {
    const tipos = environment.TIPO_DOCUMENTO_PARAMETROS;

    // Última versión de cada tipo de documento (consulta deduplicada) y cartas visibles según el rol
    const [documentos, cartas] = await Promise.all([
      lastValueFrom(this.referenciaPdfService.consultarDocumentos(auditoria._id)),
      this.obtenerCartasVisibles(auditoria._id),
    ]);
    const dependencias = this.obtenerMapaDependencias(auditoria);

    const tabDocumento = (nombre: string, tipoId: number): TabDocumento[] => {
      const documento = documentos.find((doc) => doc.tipo_id === tipoId);
      return documento ? [{ nombre, tipoId, documentoId: documento._id }] : [];
    };

    // Informe final y plan de mejoramiento primero; luego el orden del proceso de auditoría
    const tabs: TabDocumento[] = [
      ...tabDocumento("Informe final", tipos.INFORME_FINAL),
      ...tabDocumento("Plan de mejoramiento", tipos.PLAN_MEJORAMIENTO),
      ...tabDocumento("Informe preliminar", tipos.INFORME_PRELIMINAR),
      ...tabDocumento("Programa de auditoría", tipos.PROGRAMA_TRABAJO),
      ...tabDocumento("Solicitud de información", tipos.SOLICITUD_INFORMACION),
      ...cartas.map((carta) => ({
        nombre: "Carta de representación - " + (dependencias.get(carta.metadatos?.dependencia_id) ?? "Dependencia desconocida"),
        tipoId: tipos.CARTA_PRESENTACION,
        documentoId: carta._id,
      })),
      ...tabDocumento("Compromiso ético", tipos.COMPROMISO_ETICO),
    ];

    if (!tabs.length) {
      this.alertaService.showAlert("Sin documentos", "No se encontraron documentos asociados a esta auditoría.");
      return;
    }

    this.dialog.open(ModalVerDocumentosComponent, {
      width: "1200px",
      data: {
        entityId: auditoria._id,
        inferTabs: false,
        tabs,
        titulo: tituloYSubtituloAuditoria(auditoria),
        descripcion: "Documentos asociados a la auditoría",
        sufijo: `oci-${auditoria.consecutivo_OCI ?? ""}`,
      },
      autoFocus: false,
    });
  }

  // Cartas de representación: el auditado solo ve las de su dependencia (mismo criterio de Planeación)
  private async obtenerCartasVisibles(auditoriaId: string): Promise<any[]> {
    const cargoId = this.cargoAuditado();
    if (!cargoId) {
      return await lastValueFrom(
        this.referenciaPdfService
          .consultarDocumentos(auditoriaId, { tipo_id: environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION })
          .pipe(
            catchError((error) => {
              console.error("Error consultando cartas de presentación:", error);
              return of([]);
            })
          )
      );
    }

    const personaIdAuditado = await this.userService.getPersonaId();
    const documentosVisiblesAuditado: any[] = await lastValueFrom(
      this.planAuditoriaMid
        .get(`auditado/${personaIdAuditado}/documento?auditoria_id=${auditoriaId}&cargo_id=${cargoId}`)
        .pipe(
          catchError((error) => {
            console.error("Error consultando documentos visibles para auditado:", error);
            return of([]);
          })
        )
    );

    return (documentosVisiblesAuditado ?? []).filter(
      (documento: any) => documento.tipo_id === environment.TIPO_DOCUMENTO_PARAMETROS.CARTA_PRESENTACION
    );
  }

  // Cargo del auditado según su rol (null si no es auditado)
  private cargoAuditado(): number | null {
    if (this.rolService.tieneRol(environment.ROL.JEFE_DEPENDENCIA)) {
      return environment.CARGO.JEFE_DEPENDENCIA_ID;
    }
    if (this.rolService.tieneRol(environment.ROL.ASISTENTE_DEPENDENCIA)) {
      return environment.CARGO.ASISTENTE_DEPENDENCIA_ID;
    }
    return null;
  }

  private obtenerMapaDependencias(auditoria: any): Map<number, string> {
    const mapa = new Map<number, string>();
    const ids: number[] = Array.isArray(auditoria.dependencia_id) ? auditoria.dependencia_id : [];
    const nombres: string[] = Array.isArray(auditoria.dependencia_nombre) ? auditoria.dependencia_nombre : [];
    ids.forEach((id, idx) => {
      const nombre = nombres[idx]?.toLowerCase()
          .split(" ")
          .map((palabra: string) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
          .join(" ");
      mapa.set(id, nombre ?? "Dependencia desconocida");
    });
    return mapa;
  }
}
