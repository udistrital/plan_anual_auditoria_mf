import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuditoriaExternaDetalle,
  HallazgoExternoGuardado,
} from 'src/app/shared/data/models/auditoria-externa';
import { ModalVerDocumentosComponent } from 'src/app/shared/elements/components/dialogs/modal-ver-documentos/modal-ver-documentos.component';
import { AlertService } from 'src/app/shared/services/alert.service';
import { environment } from 'src/environments/environment';
import { AuditoriaExternaService } from '../../../services/auditoria-externa.service';

/** Consulta de una auditoría externa ya registrada (solo lectura, #953). */
@Component({
  selector: 'app-detalle-auditoria',
  templateUrl: './detalle-auditoria.component.html',
  styleUrls: ['../../../vista-externa.css', './detalle-auditoria.component.css'],
  standalone: false,
})
export class DetalleAuditoriaComponent implements OnInit {
  @ViewChild(MatPaginator) set paginador(paginador: MatPaginator | undefined) {
    if (paginador) this.hallazgosDataSource.paginator = paginador;
  }

  auditoria: AuditoriaExternaDetalle | null = null;
  cargando = true;
  hallazgosDataSource = new MatTableDataSource<HallazgoExternoGuardado>();
  columnasHallazgos = ['numeral', 'vigencia', 'codigo', 'descripcion', 'dependencias'];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly alertaService: AlertService,
    private readonly auditoriaExternaService: AuditoriaExternaService,
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    try {
      this.auditoria = id ? await this.auditoriaExternaService.obtener(id) : null;
      this.hallazgosDataSource.data = this.auditoria?.hallazgos ?? [];
    } catch {
      this.auditoria = null;
      this.alertaService.showErrorAlert('No fue posible cargar la auditoría externa.');
    } finally {
      this.cargando = false;
    }
  }

  regresarRuta(): void {
    this.router.navigate(['/auditorias-externas']);
  }

  verInformeFinal(): void {
    if (!this.auditoria) return;
    this.dialog.open(ModalVerDocumentosComponent, {
      width: '1200px',
      data: {
        entityId: this.auditoria._id,
        tipo: environment.TIPO_DOCUMENTO_PARAMETROS.INFORME_FINAL,
        inferTabs: true,
        titulo: 'Informe final',
        descripcion: `Informe final de la auditoría externa ${this.auditoria.nombre_auditoria}`,
        ocultarDescargarTodo: true,
      },
      autoFocus: false,
    });
  }
}
