import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OikosService } from 'src/app/core/services/oikos.service';
import {
  combinarHallazgos,
  ErrorCargueHallazgo,
  extraerErroresCargue,
  HallazgoCargado,
  HallazgoExterno,
  MAX_HALLAZGOS_EXTERNOS,
} from 'src/app/shared/data/models/registro-auditoria-externa';
import { CargarArchivoComponent } from 'src/app/shared/elements/components/cargar-archivo/cargar-archivo.component';
import { AlertService } from 'src/app/shared/services/alert.service';
import { DescargaService } from 'src/app/shared/services/descarga.service';
import { ParametrosUtilsService } from 'src/app/shared/services/parametros.service';
import { SpinnerService } from 'src/app/shared/services/spinner.service';
import { CargueHallazgosExternosService } from '../../../../services/cargue-hallazgos-externos.service';
import {
  AccionCargueHallazgos,
  DatosModalCargueHallazgos,
  ModalCargueHallazgosExternosComponent,
} from '../modal-cargue-hallazgos-externos/modal-cargue-hallazgos-externos.component';
import {
  ModalHallazgoExternoComponent,
  OpcionCatalogo,
} from '../modal-hallazgo-externo/modal-hallazgo-externo.component';

/**
 * Hallazgos de la auditoría externa, uno a uno. La lista vive en el componente
 * padre (en memoria hasta Continuar): este componente la muestra y emite la lista
 * actualizada cada vez que cambia.
 */
@Component({
  selector: 'app-hallazgos-auditoria',
  templateUrl: './hallazgos-auditoria.component.html',
  styleUrls: ['../../../../vista-externa.css', './hallazgos-auditoria.component.css'],
  standalone: false,
})
export class HallazgosAuditoriaComponent implements OnInit {
  @Input() hallazgos: HallazgoExterno[] = [];
  @Output() hallazgosActualizados = new EventEmitter<HallazgoExterno[]>();

  readonly columnas = ['numeral', 'vigencia', 'codigo', 'descripcion', 'dependencias', 'acciones'];
  readonly maximo = MAX_HALLAZGOS_EXTERNOS;
  pageSize = 10;
  pageIndex = 0;

  /** Panel «Herramientas de la tabla»: abierto por defecto; recuerda la preferencia del usuario. */
  herramientasAbiertas = true;
  private static readonly CLAVE_HERRAMIENTAS = 'sisifo.herramientasTabla';

  vigencias: OpcionCatalogo[] = [];
  dependencias: OpcionCatalogo[] = [];

  constructor(
    private readonly dialog: MatDialog,
    private readonly alertaService: AlertService,
    private readonly parametrosUtilsService: ParametrosUtilsService,
    private readonly oikosService: OikosService,
    private readonly descargaService: DescargaService,
    private readonly spinnerService: SpinnerService,
    private readonly cargueService: CargueHallazgosExternosService,
  ) {}

  ngOnInit(): void {
    try {
      this.herramientasAbiertas =
        localStorage.getItem(HallazgosAuditoriaComponent.CLAVE_HERRAMIENTAS) !== 'cerrado';
    } catch {
      this.herramientasAbiertas = true;
    }

    this.parametrosUtilsService
      .getVigencias()
      .pipe(catchError(() => of([])))
      .subscribe((vigencias) => (this.vigencias = vigencias));

    this.oikosService
      .get('dependencia?query=Activo:true&limit=0&sortby=Nombre&order=asc&fields=Id,Nombre')
      .pipe(catchError(() => of([])))
      .subscribe((respuesta: any) => {
        const lista = Array.isArray(respuesta) ? respuesta : [];
        this.dependencias = lista.filter((d: OpcionCatalogo) => d.Nombre?.length > 0);
      });
  }

  alternarHerramientas(): void {
    this.herramientasAbiertas = !this.herramientasAbiertas;
    try {
      localStorage.setItem(
        HallazgosAuditoriaComponent.CLAVE_HERRAMIENTAS,
        this.herramientasAbiertas ? 'abierto' : 'cerrado',
      );
    } catch {
      // sin almacenamiento disponible: la preferencia solo vale para esta sesión
    }
  }

  /** Hallazgos de la página actual (el paginado es solo visual: 500 filas como máximo). */
  get hallazgosPagina(): HallazgoExterno[] {
    const desde = this.pageIndex * this.pageSize;
    return this.hallazgos.slice(desde, desde + this.pageSize);
  }

  get limiteAlcanzado(): boolean {
    return this.hallazgos.length >= this.maximo;
  }

  cambiarPagina(evento: { pageIndex: number; pageSize: number }): void {
    this.pageIndex = evento.pageIndex;
    this.pageSize = evento.pageSize;
  }

  agregarHallazgo(): void {
    if (this.limiteAlcanzado) {
      this.alertaService.showAlert(
        'Límite alcanzado',
        `Se permiten máximo ${this.maximo} hallazgos por registro.`,
      );
      return;
    }
    this.abrirModal(null, null);
  }

  editarHallazgo(posicionEnPagina: number): void {
    const indice = this.pageIndex * this.pageSize + posicionEnPagina;
    this.abrirModal(this.hallazgos[indice], indice);
  }

  eliminarHallazgo(posicionEnPagina: number): void {
    const indice = this.pageIndex * this.pageSize + posicionEnPagina;
    this.alertaService.showConfirmAlert('¿Eliminar este hallazgo?').then((confirmado) => {
      if (!confirmado.value) return;
      const lista = this.hallazgos.filter((_, i) => i !== indice);
      const ultimaPagina = Math.max(0, Math.ceil(lista.length / this.pageSize) - 1);
      this.pageIndex = Math.min(this.pageIndex, ultimaPagina);
      this.emitir(lista);
    });
  }

  // ── Cargue masivo ───────────────────────────────────────────────

  async descargarPlantilla(): Promise<void> {
    try {
      this.spinnerService.show();
      const plantilla = await this.cargueService.obtenerPlantilla();
      await this.descargaService.descargarArchivo(
        plantilla,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'plantilla_hallazgos_auditoria_externa',
      );
    } catch {
      this.alertaService.showErrorAlert('Error al descargar la plantilla');
    } finally {
      this.spinnerService.hide();
    }
  }

  /** Elige el archivo (sin subirlo), lo valida en el MID y muestra la vista previa o los errores. */
  cargueMasivo(): void {
    if (this.limiteAlcanzado) {
      this.alertaService.showAlert(
        'Límite alcanzado',
        `Se permiten máximo ${this.maximo} hallazgos por registro.`,
      );
      return;
    }
    this.dialog
      .open(CargarArchivoComponent, {
        width: '800px',
        data: {
          tipoArchivo: 'xlsx',
          soloSeleccionar: true,
          descripcion: 'Cargue masivo de hallazgos de auditoría externa',
        },
      })
      .afterClosed()
      .subscribe((resultado) => {
        const archivo: File | undefined = resultado?.documento?.archivo;
        if (archivo) this.validarArchivo(archivo);
      });
  }

  private async validarArchivo(archivo: File): Promise<void> {
    this.spinnerService.show();
    let cargados: HallazgoCargado[];
    try {
      cargados = await this.cargueService.validarArchivo(archivo);
    } catch (error) {
      const { mensaje, errores } = extraerErroresCargue(error);
      this.mostrarResultado(archivo.name, [], errores, mensaje);
      return;
    } finally {
      this.spinnerService.hide();
    }

    const { hallazgos, errores } = combinarHallazgos(this.hallazgos, cargados);
    if (errores.length) {
      this.mostrarResultado(
        archivo.name,
        [],
        errores,
        'No se agregó ningún hallazgo: el archivo choca con los que ya tiene registrados.',
      );
      return;
    }
    this.mostrarResultado(archivo.name, hallazgos.slice(this.hallazgos.length), [], undefined, hallazgos);
  }

  /**
   * Abre la vista previa (hallazgos válidos) o la lista de errores. Con "Agregar" suma
   * `resultadoFinal` a la tabla; con "Volver a cargar" abre de nuevo el selector.
   */
  private mostrarResultado(
    nombreArchivo: string,
    hallazgosNuevos: HallazgoExterno[],
    errores: ErrorCargueHallazgo[],
    mensaje?: string,
    resultadoFinal?: HallazgoExterno[],
  ): void {
    const datos: DatosModalCargueHallazgos = {
      nombreArchivo,
      hallazgos: hallazgosNuevos,
      errores,
      mensaje,
    };
    this.dialog
      .open(ModalCargueHallazgosExternosComponent, { width: '90%', maxWidth: '1100px', data: datos })
      .afterClosed()
      .subscribe((accion: AccionCargueHallazgos | undefined) => {
        if (accion === 'agregar' && resultadoFinal) this.emitir(resultadoFinal);
        if (accion === 'recargar') this.cargueMasivo();
      });
  }

  private abrirModal(hallazgo: HallazgoExterno | null, indice: number | null): void {
    this.dialog
      .open(ModalHallazgoExternoComponent, {
        width: '800px',
        data: {
          hallazgo,
          indice,
          existentes: this.hallazgos,
          vigencias: this.vigencias,
          dependencias: this.dependencias,
        },
      })
      .afterClosed()
      .subscribe((resultado: HallazgoExterno | undefined) => {
        if (!resultado) return;
        const lista =
          indice === null
            ? [...this.hallazgos, resultado]
            : this.hallazgos.map((h, i) => (i === indice ? resultado : h));
        this.emitir(lista);
      });
  }

  private emitir(lista: HallazgoExterno[]): void {
    this.hallazgos = lista;
    this.hallazgosActualizados.emit(lista);
  }
}
