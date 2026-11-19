import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OikosService } from 'src/app/core/services/oikos.service';
import {
  HallazgoExterno,
  MAX_HALLAZGOS_EXTERNOS,
} from 'src/app/shared/data/models/registro-auditoria-externa';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ParametrosUtilsService } from 'src/app/shared/services/parametros.service';
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
  styleUrls: ['./hallazgos-auditoria.component.css'],
  standalone: false,
})
export class HallazgosAuditoriaComponent implements OnInit {
  @Input() hallazgos: HallazgoExterno[] = [];
  @Output() hallazgosActualizados = new EventEmitter<HallazgoExterno[]>();

  readonly columnas = ['numeral', 'vigencia', 'codigo', 'descripcion', 'dependencias', 'acciones'];
  readonly maximo = MAX_HALLAZGOS_EXTERNOS;
  pageSize = 10;
  pageIndex = 0;

  vigencias: OpcionCatalogo[] = [];
  dependencias: OpcionCatalogo[] = [];

  constructor(
    private readonly dialog: MatDialog,
    private readonly alertaService: AlertService,
    private readonly parametrosUtilsService: ParametrosUtilsService,
    private readonly oikosService: OikosService,
  ) {}

  ngOnInit(): void {
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
