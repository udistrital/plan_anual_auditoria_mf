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

  constructor(private cdref: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.construirTabla();
    this.cdref.detectChanges();
    console.log(this.auditoriasPorVigencia);
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
}
