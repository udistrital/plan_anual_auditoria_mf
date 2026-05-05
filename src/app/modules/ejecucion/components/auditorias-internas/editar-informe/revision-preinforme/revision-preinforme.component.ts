import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { environment } from 'src/environments/environment';

interface HallazgoObs {
  hallazgo: any;
  observacionesAuditado: any[];
  observacionAuditor: any | null;
}

interface SubtemaObs { subtema: any; hallazgos: HallazgoObs[]; }
interface TemaObs    { tema: any;   subtemas: SubtemaObs[];   }

const ROLES_AUDITOR = [
  environment.ROL.ADMIN, //TODO: QUITAR
  environment.ROL.AUDITOR_EXPERTO,
  environment.ROL.AUDITOR,
  environment.ROL.AUDITOR_ASISTENTE,
];

@Component({
  selector: 'app-revision-preinforme',
  templateUrl: './revision-preinforme.component.html',
  styleUrls: ['./revision-preinforme.component.css'],
})
export class RevisionPreinformeComponent implements OnInit, OnChanges {
  @Input() informeId!: string;
  @Input() puedeEscribirObservacionAuditado: boolean = false;
  @Input() puedeEscribirObservacionAuditor: boolean = false;
  @Input() usuarioId: number = 0;
  @Input() usuarioRol: string = '';
  @Input() dependenciaIds: number[] = [];

  temas: TemaObs[] = [];
  cargando = false;

  // hallazgoId → texto actual del textarea
  textoInline = new Map<string, string>();
  // hallazgoIds guardando (spinner/disable)F
  guardandoSet = new Set<string>();

  constructor(
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    private alertaService: AlertService,
  ) {}

  ngOnInit(): void {
    if (this.informeId) this.cargarDatos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['informeId'] && this.informeId) this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.cargando = true;
    try {
      const [temasResp, hallazgosResp]: [any, any] = await Promise.all([
        firstValueFrom(this.planAnualAuditoriaService.get(`tema?query=informe_id:${this.informeId}`)),
        firstValueFrom(this.planAnualAuditoriaService.get(`hallazgo?query=informe_id:${this.informeId}&limit=0`)),
      ]);

      const temasRaw: any[] = temasResp?.Data || [];
      const hallazgosRaw: any[] = hallazgosResp?.Data || [];
      const obsMap = await this.cargarObservaciones(hallazgosRaw.map((h: any) => h._id));

      this.temas = temasRaw
        .filter((t: any) => t.activo !== false)
        .map((tema: any) => ({
          tema,
          subtemas: (tema.subtema || [])
            .filter((st: any) => st.activo !== false)
            .map((subtema: any) => ({
              subtema,
              hallazgos: hallazgosRaw
                .filter((h: any) =>
                  h.subtema_id?.toString() === subtema._id?.toString() && h.activo !== false,
                )
                .map((hallazgo: any) => {
                  const obs: any[] = obsMap.get(hallazgo._id) || [];
                  return {
                    hallazgo,
                    observacionesAuditado: obs.filter((o) => !ROLES_AUDITOR.includes(o.usuario_rol)),
                    observacionAuditor: obs.find((o) => ROLES_AUDITOR.includes(o.usuario_rol)) || null,
                  };
                }),
            })),
        }));

      this.inicializarTextos();
    } catch (error) {
      console.error('Error al cargar datos de revisión:', error);
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
            this.textoInline.set(id, miObs?.observacion || '');
          } else if (this.puedeEscribirObservacionAuditor) {
            this.textoInline.set(id, item.observacionAuditor?.observacion || '');
          }
        }
      }
    }
  }

  private async cargarObservaciones(ids: string[]): Promise<Map<string, any[]>> {
    const map = new Map<string, any[]>();
    if (!ids.length) return map;
    const results = await Promise.all(
      ids.map((id) =>
        firstValueFrom(
          this.planAnualAuditoriaService.get(`observacion?query=hallazgo_id:${id},activo:true&limit=0`),
        ).then((resp: any) => ({ id, data: resp?.Data || [] })),
      ),
    );
    results.forEach(({ id, data }) => map.set(id, data));
    return map;
  }

  miObservacionAuditado(item: HallazgoObs): any | null {
    return item.observacionesAuditado.find((o) => o.usuario_id === this.usuarioId) || null;
  }

  estaGuardando(hallazgoId: string): boolean {
    return this.guardandoSet.has(hallazgoId);
  }

  actualizarTexto(hallazgoId: string, texto: string): void {
    this.textoInline.set(hallazgoId, texto);
  }

  guardarObservacion(item: HallazgoObs, observacionExistente: any | null): void {
    const hallazgoId: string = item.hallazgo._id;
    const texto = (this.textoInline.get(hallazgoId) || '').trim();

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
    this.cargarDatos();
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
        this.planAnualAuditoriaService.put(`hallazgo/${hallazgo._id}`, { rechazado: true, rechazado_por: this.usuarioId }).subscribe({
          next: () => { this.alertaService.showSuccessAlert('Hallazgo rechazado'); this.cargarDatos(); },
          error: () => this.alertaService.showErrorAlert('Error al rechazar el hallazgo'),
        });
      });
  }
}
