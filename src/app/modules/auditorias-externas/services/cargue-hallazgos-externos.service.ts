import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NuxeoService } from 'src/app/core/services/nuxeo.service';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { HallazgoCargado } from 'src/app/shared/data/models/registro-auditoria-externa';

const RUTA = 'cargue-masivo/auditoria-externa';

/**
 * Cargue masivo de hallazgos de auditorías externas. El MID solo valida el archivo
 * (no guarda nada): aquí se pide la plantilla y se valida el archivo elegido.
 */
@Injectable({ providedIn: 'root' })
export class CargueHallazgosExternosService {
  constructor(
    private readonly planAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly nuxeoService: NuxeoService,
  ) {}

  /** Plantilla de hallazgos en Base64. */
  async obtenerPlantilla(): Promise<string> {
    const respuesta: any = await firstValueFrom(
      this.planAnualAuditoriaMid.get(`${RUTA}/plantilla`),
    );
    if (!respuesta?.base64) {
      throw new Error('Respuesta inválida del servidor: base64 no encontrado');
    }
    return respuesta.base64;
  }

  /**
   * Valida el archivo en el MID y devuelve los hallazgos para la vista previa.
   * Si hay errores lanza el error del servicio (ver `extraerErroresCargue`).
   */
  async validarArchivo(archivo: File): Promise<HallazgoCargado[]> {
    const base64data = (await this.nuxeoService.fileABase64(archivo)) as string;
    const respuesta: any = await firstValueFrom(
      this.planAnualAuditoriaMid.post(`${RUTA}/validacion`, { base64data }),
    );
    return respuesta?.Data?.hallazgos ?? [];
  }
}
