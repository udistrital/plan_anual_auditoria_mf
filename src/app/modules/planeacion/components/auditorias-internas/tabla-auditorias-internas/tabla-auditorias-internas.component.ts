import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  ViewChild,
} from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { colocacionesContructorTabla } from "./tabla-auditorias-internas.utilidades";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { MatDialog } from "@angular/material/dialog";
import { ModalVerDocumentoComponent } from "src/app/shared/elements/components/dialogs/modal-ver-documento/modal-ver-documento.component";
import { Router } from '@angular/router';

@Component({
  selector: "app-tabla-auditorias-internas",
  templateUrl: "./tabla-auditorias-internas.component.html",
  styleUrl: "./tabla-auditorias-internas.component.css",
})
export class TablaAuditoriasInternasComponent implements AfterViewInit {
  @Input() auditoriasPorVigencia: any;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  auditorias: MatTableDataSource<any> = new MatTableDataSource();
  auditoriasContructorTabla: any;
  tablaColumnas: any;

  constructor(
    private cdref: ChangeDetectorRef,
    private dialog: MatDialog,
    private planAuditoriaMid: PlanAnualAuditoriaMid,
    private router: Router
  ) {}

  ngAfterViewInit() {
    this.construirTabla();
    this.cdref.detectChanges();
  }

  construirTabla() {
    this.auditoriasContructorTabla = colocacionesContructorTabla;
    this.tablaColumnas = this.auditoriasContructorTabla.map(
      (column: any) => column.columnDef
    );
    //Asigna la info a la tabla
    this.auditorias = new MatTableDataSource(this.auditoriasPorVigencia);
    this.auditorias.paginator = this.paginator;
    this.auditorias.sort = this.sort;
  }

  verDocumento(auditoria: any) {
    const auditoriaId = auditoria._id;
    this.planAuditoriaMid
      .get(`plantilla/plan-trabajo/${auditoriaId}`)
      .subscribe((res) => {
        const documentoBase64 = res.Data;
        const dialogRef = this.dialog.open(ModalVerDocumentoComponent, {
          width: "1000px",
          data: documentoBase64,
          autoFocus: false,
        });
      });
  }
  editarAuditoria(auditoria: any): void {
    console.log("adiii ",auditoria._id)
    this.router.navigate([`/planeacion/auditorias-internas/editar`, auditoria._id]);
  }
}
