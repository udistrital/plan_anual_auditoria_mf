import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { AlertService } from 'src/app/shared/services/alert.service';
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

  constructor(
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService,
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
      this.inicializarTextos();
    } catch (error) {
      console.error('Error al cargar observaciones de revisión:', error);
    }
    this.cargando = false;
  }

  private inicializarTextos(): void {
    this.textoInline.clear();
    for (const temaItem of this.temas) {
      for (const subtemaItem of temaItem.subtemas) {
        for (const item of subtemaItem.hallazgos) {
          const id: string = item.hallazgo._id;
          if (this.puedeEscribirObservacionAuditado) {
            const miObs = item.observacionesAuditado.find((o: any) => o.usuario_id === this.usuarioId);
            this.textoInline.set(id, miObs?.observacion ?? '');
          } else if (this.puedeEscribirObservacionAuditor) {
            this.textoInline.set(id, item.observacionAuditor?.observacion ?? '');
          }
        }
      }
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

  guardarObservacion(item: HallazgoObs, observacionExistente: any): void {
    const hallazgoId: string = item.hallazgo._id;
    const texto = (this.textoInline.get(hallazgoId) ?? '').trim();

    if (!texto) {
      this.alertaService.showAlert('Campo vacío', 'La observación no puede estar vacía.');
      return;
    }

    this.guardandoSet.add(hallazgoId);

    if (observacionExistente) {
      this.planAnualAuditoriaService
        .put(`observacion/${observacionExistente._id}`, { observacion: texto })
        .subscribe({
          next: () => this.onGuardadoExitoso(hallazgoId),
          error: () => this.onGuardadoError(hallazgoId),
        });
    } else {
      this.planAnualAuditoriaService
        .post('observacion', {
          hallazgo_id: hallazgoId,
          observacion: texto,
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
