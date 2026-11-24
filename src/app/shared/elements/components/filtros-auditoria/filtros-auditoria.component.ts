import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { Subject, Subscription, debounceTime, distinctUntilChanged } from "rxjs";

export interface OpcionEstadoFiltro {
  id: number;
  nombre: string;
}

export interface FiltrosAuditoria {
  estado: number | null;
  consecutivo: string;
}

/** Preferencia de sección abierta/cerrada, compartida por todas las tablas que usan el filtro. */
const CLAVE_PREFERENCIA = "sisifo-filtros-auditoria";
/** Espera tras la última tecla antes de consultar por consecutivo. */
const ESPERA_CONSECUTIVO_MS = 400;

let siguienteId = 0;

/**
 * Filtros de búsqueda de los listados de auditorías (estado y consecutivo OCI) en una sección
 * que se puede desplegar y contraer. El componente solo informa los cambios; la consulta la hace la tabla.
 */
@Component({
  selector: "app-filtros-auditoria",
  templateUrl: "./filtros-auditoria.component.html",
  styleUrls: ["./filtros-auditoria.component.css"],
  standalone: false,
})
export class FiltrosAuditoriaComponent implements OnInit, OnChanges, OnDestroy {
  @Input() estados: OpcionEstadoFiltro[] = [];
  @Input() estado: number | null = null;
  @Input() consecutivo: string = "";

  @Output() filtrosCambio = new EventEmitter<FiltrosAuditoria>();

  readonly idCuerpo = `filtros-auditoria-${++siguienteId}`;
  abierto = FiltrosAuditoriaComponent.leerPreferencia();
  estadoSeleccionado: number | null = null;
  textoConsecutivo = "";

  private readonly consecutivo$ = new Subject<string>();
  private suscripcion?: Subscription;

  ngOnInit(): void {
    this.suscripcion = this.consecutivo$
      .pipe(debounceTime(ESPERA_CONSECUTIVO_MS), distinctUntilChanged())
      .subscribe(() => this.emitir());
  }

  ngOnChanges(cambios: SimpleChanges): void {
    // La tabla puede limpiar los filtros (p. ej. cuando no hay resultados)
    if (cambios["estado"]) {
      this.estadoSeleccionado = this.estado ?? null;
    }
    if (cambios["consecutivo"]) {
      this.textoConsecutivo = this.consecutivo ?? "";
    }
  }

  ngOnDestroy(): void {
    this.suscripcion?.unsubscribe();
  }

  get filtrosActivos(): number {
    return (this.estadoSeleccionado ? 1 : 0) + (this.textoConsecutivo.trim() ? 1 : 0);
  }

  alternar(): void {
    this.abierto = !this.abierto;
    try {
      localStorage.setItem(CLAVE_PREFERENCIA, this.abierto ? "abierto" : "cerrado");
    } catch {
      // Sin almacenamiento disponible: la preferencia solo dura mientras la vista esté abierta
    }
  }

  cambiarEstado(estado: number | null): void {
    this.estadoSeleccionado = estado;
    this.emitir();
  }

  cambiarConsecutivo(texto: string): void {
    this.textoConsecutivo = texto;
    this.consecutivo$.next(texto.trim());
  }

  limpiarConsecutivo(): void {
    this.textoConsecutivo = "";
    this.consecutivo$.next("");
  }

  limpiar(): void {
    this.estadoSeleccionado = null;
    this.textoConsecutivo = "";
    // Reinicia el debounce para que una escritura pendiente no vuelva a aplicar el texto anterior
    this.consecutivo$.next("");
    this.emitir();
  }

  private emitir(): void {
    this.filtrosCambio.emit({
      estado: this.estadoSeleccionado,
      consecutivo: this.textoConsecutivo.trim(),
    });
  }

  private static leerPreferencia(): boolean {
    try {
      return localStorage.getItem(CLAVE_PREFERENCIA) !== "cerrado";
    } catch {
      return true;
    }
  }
}
