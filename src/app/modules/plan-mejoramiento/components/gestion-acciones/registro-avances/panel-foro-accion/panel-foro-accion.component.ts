import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PlanAnualAuditoriaMid } from 'src/app/core/services/plan-anual-auditoria-mid.service';
import { ComentarioAccion } from 'src/app/shared/data/models/plan-mejoramiento/plan-mejoramiento.models';

export interface DatosPanelForo {
  accionId: string;
  /** Persona que consulta (persona_id del usuario). */
  personaId: number;
  /** Código del rol con que consulta o comenta; null si el usuario no tiene un rol del foro. */
  rol: string | null;
}

/** Mensajes que se piden por página al MID. */
const LIMITE_PAGINA = 20;
const MAXIMO_MENSAJE = 1000;

/**
 * Foro de seguimiento de la acción (#948): lista plana de comentarios guardados por el MID.
 * Se lee al abrir, con «Actualizar» y tras enviar; no hay tiempo real. Los mensajes no se editan.
 * Quién puede comentar lo decide el MID (`MetaData.puede_comentar`); el front solo lo refleja.
 */
@Component({
  selector: 'app-panel-foro-accion',
  templateUrl: './panel-foro-accion.component.html',
  styleUrls: ['../panel-lateral.css', './panel-foro-accion.component.css'],
  standalone: false,
})
export class PanelForoAccionComponent implements OnInit {
  readonly maximoMensaje = MAXIMO_MENSAJE;

  /** En orden cronológico: el más antiguo arriba y el más reciente abajo. */
  comentarios: ComentarioAccion[] = [];
  total = 0;
  puedeComentar = false;
  cargando = true;
  cargandoAnteriores = false;
  errorCarga = false;
  enviando = false;
  errorEnvio = '';
  nuevoMensaje = '';

  @ViewChild('cuerpo') private readonly cuerpo?: ElementRef<HTMLElement>;

  constructor(
    @Inject(MAT_DIALOG_DATA) readonly datos: DatosPanelForo,
    private readonly planAuditoriaMid: PlanAnualAuditoriaMid
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  get hayAnteriores(): boolean {
    return this.comentarios.length < this.total;
  }

  get mensajeValido(): boolean {
    const texto = this.nuevoMensaje.trim();
    return texto.length > 0 && texto.length <= MAXIMO_MENSAJE;
  }

  /** Lee la última página y la une con lo que ya estaba (sin perder los mensajes anteriores cargados). */
  cargar(): void {
    this.cargando = true;
    this.errorCarga = false;
    this.pedirPagina(0).subscribe({
      next: (respuesta) => {
        this.unir(respuesta.Data ?? []);
        this.total = respuesta.MetaData?.Count ?? this.comentarios.length;
        this.puedeComentar = !!respuesta.MetaData?.puede_comentar;
        this.cargando = false;
        this.irAlFinal();
      },
      error: () => {
        this.errorCarga = true;
        this.cargando = false;
      },
    });
  }

  verAnteriores(): void {
    if (this.cargandoAnteriores) return;
    this.cargandoAnteriores = true;
    this.pedirPagina(this.comentarios.length).subscribe({
      next: (respuesta) => {
        this.unir(respuesta.Data ?? []);
        this.total = respuesta.MetaData?.Count ?? this.total;
        this.cargandoAnteriores = false;
      },
      error: () => {
        this.cargandoAnteriores = false;
        this.errorCarga = true;
      },
    });
  }

  enviar(): void {
    if (!this.mensajeValido || this.enviando || !this.datos.rol) return;
    this.enviando = true;
    this.errorEnvio = '';
    this.planAuditoriaMid
      .post(`accion-mejora/${this.datos.accionId}/comentario`, {
        mensaje: this.nuevoMensaje.trim(),
        usuario_id: this.datos.personaId,
        usuario_rol: this.datos.rol,
      })
      .subscribe({
        next: (respuesta: any) => {
          if (respuesta?.Data) {
            this.unir([respuesta.Data]);
            this.total++;
          }
          this.nuevoMensaje = '';
          this.enviando = false;
          this.irAlFinal();
        },
        error: (error: any) => {
          // El texto se conserva para que la persona pueda reintentar
          this.errorEnvio = this.textoDeError(error);
          this.enviando = false;
        },
      });
  }

  iniciales(nombre: string): string {
    return nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
  }

  private pedirPagina(offset: number) {
    const consulta = new URLSearchParams({ limit: String(LIMITE_PAGINA), offset: String(offset) });
    if (this.datos.rol) {
      consulta.set('persona_id', String(this.datos.personaId));
      consulta.set('rol', this.datos.rol);
    }
    return this.planAuditoriaMid.get(`accion-mejora/${this.datos.accionId}/comentario?${consulta.toString()}`);
  }

  /** Mezcla por _id (puede haber llegado alguno nuevo entre páginas) y ordena del más antiguo al más reciente. */
  private unir(nuevos: ComentarioAccion[]): void {
    const porId = new Map(this.comentarios.map(c => [c._id, c]));
    nuevos.forEach(c => porId.set(c._id, c));
    this.comentarios = [...porId.values()].sort(
      (a, b) => a.fecha_creacion.localeCompare(b.fecha_creacion) || a._id.localeCompare(b._id)
    );
  }

  private textoDeError(error: any): string {
    if (error?.status === 403) {
      return 'No puede comentar en esta acción: solo las dependencias responsables y el personal de Control Interno.';
    }
    // Solo los 400 del MID (mensaje vacío o demasiado largo) llevan un texto pensado para la persona;
    // cualquier otro error puede venir del gateway con detalles técnicos y no se muestra.
    const detalle = error?.error?.message;
    return error?.status === 400 && typeof detalle === 'string' && detalle
      ? detalle
      : 'No se pudo enviar el comentario. Intente de nuevo.';
  }

  private irAlFinal(): void {
    setTimeout(() => {
      const el = this.cuerpo?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
