import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NuxeoService } from 'src/app/core/services/nuxeo.service';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import {
  AuditoriaExternaDetalle,
  ListadoAuditoriasExternas,
  ResultadoRegistroAuditoriaExterna,
} from 'src/app/shared/data/models/auditoria-externa';
import {
  armarCuerpoRegistro,
  InformeFinalLocal,
  RegistroAuditoriaExterna,
} from 'src/app/shared/data/models/registro-auditoria-externa';
import { environment } from 'src/environments/environment';

const RUTA = 'auditoria-externa';

/**
 * Registro y consulta de auditorías externas (#953). Nada se guarda hasta Continuar:
 * entonces se sube el PDF a Nuxeo y se envía todo al MID en una sola operación.
 */
@Injectable({ providedIn: 'root' })
export class AuditoriaExternaService {
  constructor(
    private readonly planAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly nuxeoService: NuxeoService,
  ) {}

  async listar(
    vigenciaId: number | null,
    limit: number,
    offset: number,
  ): Promise<ListadoAuditoriasExternas> {
    const filtro = vigenciaId ? `vigencia_id=${vigenciaId}&` : '';
    const respuesta: any = await firstValueFrom(
      this.planAnualAuditoriaMid.get(`${RUTA}?${filtro}limit=${limit}&offset=${offset}`),
    );
    return {
      auditorias: respuesta?.Data ?? [],
      total: respuesta?.MetaData?.Count ?? 0,
    };
  }

  async obtener(id: string): Promise<AuditoriaExternaDetalle> {
    const respuesta: any = await firstValueFrom(
      this.planAnualAuditoriaMid.get(`${RUTA}/${id}`),
    );
    return respuesta?.Data;
  }

  /** Sube el informe a Nuxeo y devuelve su id y enlace. */
  async subirInforme(
    informe: InformeFinalLocal,
    codigoEntidad: string,
  ): Promise<{ nuxeo_id: number; nuxeo_enlace: string }> {
    const respuesta = await firstValueFrom(
      this.nuxeoService.guardarArchivos([
        {
          IdTipoDocumento: environment.TIPO_DOCUMENTO.INFORMES,
          nombre: `informe_final_auditoria_externa_${codigoEntidad}`,
          descripcion: 'Informe final de auditoría externa',
          metadatos: {},
          file: informe.base64,
        },
      ]),
    );
    const documento = respuesta?.[0];
    if (!documento?.Id || !documento?.Enlace) {
      throw new Error('No se recibió una respuesta válida al guardar el informe en Nuxeo.');
    }
    return { nuxeo_id: documento.Id, nuxeo_enlace: documento.Enlace };
  }

  async registrar(
    registro: RegistroAuditoriaExterna,
    documento: { nuxeo_id: number; nuxeo_enlace: string },
    usuario: { id: number; rol: string },
  ): Promise<ResultadoRegistroAuditoriaExterna> {
    const respuesta: any = await firstValueFrom(
      this.planAnualAuditoriaMid.post(RUTA, armarCuerpoRegistro(registro, documento, usuario)),
    );
    return respuesta?.Data;
  }
}
