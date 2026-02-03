import { ChangeDetectorRef, Component, Input, ViewChild } from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { planMejoramientoConstructorTabla } from "./tabla-plan-mejoramiento.utilidades";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { AlertService } from "src/app/shared/services/alert.service";

@Component({
  selector: "app-tabla-plan-mejoramiento",
  templateUrl: "./tabla-plan-mejoramiento.component.html",
  styleUrls: ["./tabla-plan-mejoramiento.component.css"],
})
export class TablaPlanMejoramientoComponent {
  @Input() vigenciaId: any;
  @Input() tipoEvaluacionId: any;
  @Input() role: any;
  @ViewChild(MatSort) sort!: MatSort;

  planesPorVigencia: any[] = [];
  planesDataSource: MatTableDataSource<any> = new MatTableDataSource();
  planesConstructorTabla: any;
  banderaTablePlanes: boolean = false;
  tablaColumnas: any;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  totalRegistros: number = 0;
  pageSize: number = 5;
  pageIndex: number = 0;
  itemsPerPage: number[] = [5, 10, 20];

  constructor(
    private alertaService: AlertService,
    private changeDetector: ChangeDetectorRef,
    private dialog: MatDialog,
    private planAuditoriaMid: PlanAnualAuditoriaMid,
    private router: Router
  ) {}

  listarPlanesPorFiltros(
    vigenciaId: number,
    tipoEvaluacionId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0
  ) {
    console.log("Rol:", this.role, "| Vigencia:", vigenciaId, "| Tipo:", tipoEvaluacionId);
    this.planesPorVigencia = [];

    const planesMock = [
      { _id: "1", vigencia_nombre: "2025", titulo: "Auditoría de Gestión Financiera", auditores_nombres: "Pepito Pérez", dependencia_nombre: "Proceso o Dependencia", lider_nombre: "Nombre Líder", responsable_nombre: "Nombre Responsable", estado_nombre: "Formulación" },
      { _id: "2", vigencia_nombre: "2025", titulo: "Auditoría de Recursos Humanos", auditores_nombres: "María García", dependencia_nombre: "Gestión Humana", lider_nombre: "Carlos Rodríguez", responsable_nombre: "Ana Martínez", estado_nombre: "Formulación" },
      { _id: "3", vigencia_nombre: "2025", titulo: "Auditoría de Control Interno", auditores_nombres: "Pedro López, Diana Torres", dependencia_nombre: "Control Interno", lider_nombre: "Luis Hernández", responsable_nombre: "Sandra Gómez", estado_nombre: "En ejecución" },
      { _id: "4", vigencia_nombre: "2025", titulo: "Auditoría de Compras y Contratación", auditores_nombres: "Fernando Castro", dependencia_nombre: "Departamento de Compras", lider_nombre: "Gabriela Moreno", responsable_nombre: "Jorge Ramírez", estado_nombre: "En revisión" },
      { _id: "5", vigencia_nombre: "2025", titulo: "Auditoría de Tecnología", auditores_nombres: "Carolina Vega", dependencia_nombre: "Tecnología e Informática", lider_nombre: "Ricardo Ortiz", responsable_nombre: "Mónica Vargas", estado_nombre: "Formulación" },
      { _id: "6", vigencia_nombre: "2025", titulo: "Auditoría de Seguridad y Salud", auditores_nombres: "Julián Rojas", dependencia_nombre: "Seguridad y Salud", lider_nombre: "Laura Sánchez", responsable_nombre: "Eduardo Jiménez", estado_nombre: "En ejecución" },
      { _id: "7", vigencia_nombre: "2025", titulo: "Auditoría de Calidad", auditores_nombres: "Beatriz Morales", dependencia_nombre: "Gestión de Calidad", lider_nombre: "Alejandro Cruz", responsable_nombre: "Valeria Gutiérrez", estado_nombre: "Completado" },
      { _id: "8", vigencia_nombre: "2025", titulo: "Auditoría Ambiental", auditores_nombres: "Natalia Pineda", dependencia_nombre: "Gestión Ambiental", lider_nombre: "Sergio Medina", responsable_nombre: "Claudia Ríos", estado_nombre: "Formulación" },
    ];

    const inicio = offset;
    const fin = inicio + limit;
    const planesPaginados = planesMock.slice(inicio, fin);

    const respuestaMock = {
      Data: planesPaginados,
      MetaData: { Count: planesMock.length }
    };

    const planes: any[] = respuestaMock.Data;

    if (!(planes.length > 0)) {
      this.banderaTablePlanes = false;
      this.planesDataSource.data = [];
      return this.alertaService.showAlert(
        "No hay planes registrados",
        "Actualmente no hay planes de mejoramiento para los filtros seleccionados."
      );
    }

    this.planesPorVigencia = planes;
    this.totalRegistros = respuestaMock.MetaData.Count;
    this.banderaTablePlanes = true;
    this.construirTabla();
  }

  construirTabla() {
    this.planesConstructorTabla = planMejoramientoConstructorTabla;
    this.tablaColumnas = this.planesConstructorTabla.map((column: any) => column.columnDef);
    this.planesDataSource = new MatTableDataSource(this.planesPorVigencia);

    if (!this.paginator) {
      this.planesDataSource.paginator = this.paginator;
      this.planesDataSource.sort = this.sort;
    }
    this.changeDetector.detectChanges();
  }

  manejarCambioPaginado(evento: PageEvent) {
    this.pageSize = evento.pageSize;
    this.pageIndex = evento.pageIndex;
    const offset = this.pageIndex * this.pageSize;
    this.listarPlanesPorFiltros(this.vigenciaId, this.tipoEvaluacionId, this.pageSize, offset);
    this.paginator.length = this.totalRegistros;
    this.paginator.pageSize = this.pageSize;
    this.paginator.pageIndex = this.pageIndex;
  }

  registrarPlan(plan: any) {
    this.router.navigate([`/planes/plan-mejoramiento/registrar-plan/${plan._id}`]);
  }

  enviarAprobacion(plan: any) {
    this.alertaService
      .showConfirmAlert("¿Está seguro de enviar el plan de mejoramiento para aprobación?")
      .then((confirmado) => {
        if (!confirmado.value) return;
        console.log("Enviar aprobación plan:", plan);
        this.alertaService.showSuccessAlert("Plan enviado exitosamente", "ENVIADO PARA APROBACIÓN");
      });
  }

  verDocumentosAuditoria(plan: any) {
    console.log("Ver documentos de auditoría:", plan);
  }
}