import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { NuxeoService } from 'src/app/core/services/nuxeo.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { contieneImagen, descripcionAHtml, esHtmlVacio, tamanoImagenAEstilo } from 'src/app/shared/utils/html.util';
import { environment } from 'src/environments/environment';

interface HallazgoObs {
  hallazgo: any;
  observacionesAuditado: any[];
  observacionAuditor: any;
}

interface SubtemaObs { subtema: any; hallazgos: HallazgoObs[]; }
interface TemaObs    { tema: any;   subtemas: SubtemaObs[];   }

const ROLES_AUDITOR = [
  environment.ROL.AUDITOR_EXPERTO,
  environment.ROL.AUDITOR,
  environment.ROL.AUDITOR_ASISTENTE,
];

@Component({
    selector: 'app-revision-preinforme',
    templateUrl: './revision-preinforme.component.html',
    styleUrls: ['./revision-preinforme.component.css'],
    standalone: false
})
export class RevisionPreinformeComponent implements OnChanges {
  @Input() informeId!: string;
  @Input() temasRaw: any[] | null = null;
  @Input() hallazgosRaw: any[] | null = null;
  @Input() puedeEscribirObservacionAuditado: boolean = false;
  @Input() puedeEscribirObservacionAuditor: boolean = false;
  @Input() usuarioId: number = 0;
  @Input() usuarioRol: string = '';
  @Input() dependenciaIds: number[] = [];
  @Input() fechaFinRevision: Date | null = null;
  @Output() datosModificados = new EventEmitter<void>();

  get fechaFinFormateada(): string {
    if (!this.fechaFinRevision) return '';
    return new Date(this.fechaFinRevision).toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  temas: TemaObs[] = [];
  cargando = false;

  textoInline = new Map<string, string>();
  guardandoSet = new Set<string>();

  // Por observación guardada, su valor persistido (texto/HTML/enlace Nuxeo) y el HTML cargado en el editor.
  // Si el HTML no cambia al guardar, se reutiliza el valor persistido en vez de volver a subir el documento.
  private readonly observacionesNuxeo = new Map<string, { guardada: string; html: string }>();
  // Observaciones cuyo contenido no se pudo descargar del gestor documental: se conserva el valor original al guardar.
  private readonly observacionesNoCargadas = new Map<string, string>();

  constructor(
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService,
    private readonly nuxeoService: NuxeoService,
    private readonly alertaService: AlertService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['temasRaw'] || changes['hallazgosRaw']) && this.temasRaw !== null && this.hallazgosRaw !== null) {
      this.cargarObservacionesYReconstruir();
    }
  }

  private async cargarObservacionesYReconstruir(): Promise<void> {
    if (!this.temasRaw || !this.hallazgosRaw) return;
    this.cargando = true;
    try {
      const obsMap = await this.cargarObservaciones(this.hallazgosRaw.map((h: any) => h._id));
      this.temas = this.temasRaw
        .filter((t: any) => t.activo !== false)
        .map((tema: any) => ({
          tema,
          subtemas: (tema.subtema ?? [])
            .filter((st: any) => st.activo !== false)
            .map((subtema: any) => ({
              subtema,
              hallazgos: this.hallazgosRaw!
                .filter((h: any) =>
                  h.subtema_id?.toString() === subtema._id?.toString() && h.activo !== false,
                )
                .map((hallazgo: any) => {
                  const obs: any[] = obsMap.get(hallazgo._id) ?? [];
                  return {
                    hallazgo,
                    observacionesAuditado: obs.filter((o) => !ROLES_AUDITOR.includes(o.usuario_rol)),
                    observacionAuditor: obs.find((o) => ROLES_AUDITOR.includes(o.usuario_rol)) ?? null,
                  };
                }),
            })),
        }));
      await this.inicializarTextos();
    } catch (error) {
      console.error('Error al cargar observaciones de revisión:', error);
    }
    this.cargando = false;
  }

  private async inicializarTextos(): Promise<void> {
    const previo = new Map(this.textoInline);
    this.textoInline.clear();
    this.observacionesNuxeo.clear();
    this.observacionesNoCargadas.clear();

    for (const temaItem of this.temas) {
      for (const subtemaItem of temaItem.subtemas) {
        for (const item of subtemaItem.hallazgos) {
          const id: string = item.hallazgo._id;
          if (this.puedeEscribirObservacionAuditado) {
            const miObs = item.observacionesAuditado.find((o: any) => o.usuario_id === this.usuarioId);
            const html = miObs ? await this.resolverObservacion(miObs) : null;
            // Si ya hay obs guardada en servidor, usarla; si no, preservar el texto no guardado
            this.textoInline.set(id, html ?? previo.get(id) ?? '');
          } else if (this.puedeEscribirObservacionAuditor) {
            const html = item.observacionAuditor ? await this.resolverObservacion(item.observacionAuditor) : null;
            this.textoInline.set(id, html ?? previo.get(id) ?? '');
          }
        }
      }
    }
  }

  // Deja la observación guardada en HTML para el editor, recordando su valor original.
  private async resolverObservacion(obs: any): Promise<string> {
    const guardada: string = obs.observacion ?? '';
    const obsId: string = obs._id?.toString();
    try {
      const html = await descripcionAHtml(guardada, (uuid) => this.nuxeoService.obtenerPorUUID(uuid));
      if (obsId) {
        this.observacionesNuxeo.set(obsId, { guardada, html });
      }
      return html;
    } catch (error) {
      // Si el gestor documental falla, la observación se muestra igual en vez de dejar el campo vacío
      console.error('No se pudo cargar la observación desde el gestor documental:', error);
      if (obsId) {
        this.observacionesNoCargadas.set(obsId, guardada);
      }
      return guardada;
    }
  }

  private async cargarObservaciones(ids: string[]): Promise<Map<string, any[]>> {
    const map = new Map<string, any[]>();
    if (!ids.length) return map;
    const resp: any = await firstValueFrom(
      this.planAnualAuditoriaService.get(`observacion?query=hallazgo_id__in:${ids.join('|')},activo:true&limit=0`),
    );
    for (const obs of (resp?.Data ?? [])) {
      const hid = obs.hallazgo_id?.toString();
      if (!map.has(hid)) map.set(hid, []);
      map.get(hid)!.push(obs);
    }
    return map;
  }

  hallazgoNumeral(hallazgos: HallazgoObs[], k: number): number {
    return hallazgos.slice(0, k + 1).filter(h => !h.hallazgo.rechazado).length;
  }

  miObservacionAuditado(item: HallazgoObs): any {
    return item.observacionesAuditado.find((o) => o.usuario_id === this.usuarioId) ?? null;
  }

  estaGuardando(hallazgoId: string): boolean {
    return this.guardandoSet.has(hallazgoId);
  }

  actualizarTexto(hallazgoId: string, texto: string): void {
    this.textoInline.set(hallazgoId, texto);
  }

  async guardarObservacion(item: HallazgoObs, observacionExistente: any): Promise<void> {
    const hallazgoId: string = item.hallazgo._id;
    const html = this.textoInline.get(hallazgoId) ?? '';

    // Valida el contenido real del texto enriquecido (una imagen cuenta como contenido).
    if (esHtmlVacio(html)) {
      this.alertaService.showAlert('Campo vacío', 'La observación no puede estar vacía.');
      return;
    }

    this.guardandoSet.add(hallazgoId);

    let valorAGuardar: string;
    try {
      valorAGuardar = await this.prepararValorObservacion(html, observacionExistente, hallazgoId);
    } catch (error) {
      // Si la imagen no se pudo subir, se informa y NO se marca como guardado (criterio de aceptación #958)
      console.error('Error al subir la observación al gestor documental:', error);
      this.guardandoSet.delete(hallazgoId);
      this.alertaService.showErrorAlert(
        'No se pudo guardar la imagen de la observación en el gestor documental. Intente de nuevo.',
      );
      return;
    }

    if (observacionExistente) {
      this.planAnualAuditoriaService
        .put(`observacion/${observacionExistente._id}`, { observacion: valorAGuardar })
        .subscribe({
          next: () => this.onGuardadoExitoso(hallazgoId),
          error: () => this.onGuardadoError(hallazgoId),
        });
    } else {
      this.planAnualAuditoriaService
        .post('observacion', {
          hallazgo_id: hallazgoId,
          observacion: valorAGuardar,
          dependencia_id: this.dependenciaIds,
          usuario_id: this.usuarioId,
          usuario_rol: this.usuarioRol,
        })
        .subscribe({
          next: () => this.onGuardadoExitoso(hallazgoId),
          error: () => this.onGuardadoError(hallazgoId),
        });
    }
  }

  // Devuelve el valor a persistir: HTML plano, o enlace Nuxeo si la observación trae imágenes.
  private async prepararValorObservacion(
    html: string,
    observacionExistente: any,
    hallazgoId: string,
  ): Promise<string> {
    const obsId: string | undefined = observacionExistente?._id?.toString();

    if (obsId) {
      const noCargada = this.observacionesNoCargadas.get(obsId);
      if (noCargada !== undefined) return noCargada;

      const original = this.observacionesNuxeo.get(obsId);
      // Sin cambios en el contenido: se reutiliza el valor guardado (y el documento existente en Nuxeo)
      if (original && original.html === html) return original.guardada;
    }

    if (!contieneImagen(html)) return html;

    const nombre = `Observacion de hallazgo ${hallazgoId} de informe ${this.informeId}.html`;
    const enlace = await this.subirHtmlANuxeo(html, nombre, 'Documento HTML (Observación de hallazgo)');
    if (obsId) {
      this.observacionesNuxeo.set(obsId, { guardada: enlace, html });
    }
    return enlace;
  }

  // Sube el HTML de una observación (con imágenes) a Nuxeo y devuelve el valor a guardar.
  private async subirHtmlANuxeo(htmlOriginal: string, nombre: string, descripcionDocumento: string): Promise<string> {
    const html = tamanoImagenAEstilo(String(htmlOriginal));

    const blob = new Blob([html], { type: 'text/html' });
    const htmlFile = new File([blob], 'archivo.html', { type: 'text/html' });
    const base64 = await this.nuxeoService.fileABase64(htmlFile) as string;

    const payload = {
      IdTipoDocumento: environment.TIPO_DOCUMENTO.INFORMES,
      nombre,
      descripcion: descripcionDocumento,
      metadatos: {},
      file: JSON.stringify(base64),
    };

    const response: any = await firstValueFrom(this.nuxeoService.guardarArchivos([payload]));
    const enlace = response?.[0]?.res?.Enlace;
    if (!enlace) throw new Error('Nuxeo no devolvió el enlace del documento');

    return `NuxeoEnlace:${enlace}`;
  }

  private onGuardadoExitoso(hallazgoId: string): void {
    this.guardandoSet.delete(hallazgoId);
    this.alertaService.showSuccessAlert('Observación guardada');
    // Solo cambió una observación — solo recargamos observaciones (temas/hallazgos no cambiaron)
    this.cargarObservacionesYReconstruir();
  }

  private onGuardadoError(hallazgoId: string): void {
    this.guardandoSet.delete(hallazgoId);
    this.alertaService.showErrorAlert('Error al guardar la observación');
  }

  rechazarHallazgo(hallazgo: any): void {
    this.alertaService
      .showConfirmAlert(`¿Está seguro(a) de rechazar el hallazgo "${hallazgo.titulo || hallazgo.criterio}"?`)
      .then((result) => {
        if (!result.isConfirmed) return;
        const data = { rechazado: true, rechazado_por: this.usuarioId, rechazado_por_rol: this.usuarioRol };
        this.planAnualAuditoriaService.put(`hallazgo/${hallazgo._id}`, data).subscribe({
          next: () => { this.alertaService.showSuccessAlert('Hallazgo rechazado'); this.datosModificados.emit(); },
          error: () => this.alertaService.showErrorAlert('Error al rechazar el hallazgo'),
        });
      });
  }
}
