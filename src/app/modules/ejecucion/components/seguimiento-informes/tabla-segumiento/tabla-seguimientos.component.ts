import { ChangeDetectorRef, Component, Input, ViewChild } from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { seguimientosConstructorTabla } from "./tabla-seguimientos.utilidades";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { MatDialog } from "@angular/material/dialog";
import { ModalVerDocumentoComponent } from "src/app/shared/elements/components/dialogs/modal-ver-documento/modal-ver-documento.component";
import { Router } from "@angular/router";
import { AlertService } from "src/app/shared/services/alert.service";

@Component({
  selector: "app-tabla-seguimientos",
  templateUrl: "./tabla-seguimientos.component.html",
  styleUrls: ["./tabla-seguimientos.component.css"],
})
export class TablaSeguimientosComponent {
  @Input() vigenciaId: any;
  @Input() role: any;
  @ViewChild(MatSort) sort!: MatSort;

  seguimientosPorVigencia: any[] = [];
  seguimientosDataSource: MatTableDataSource<any> = new MatTableDataSource();
  seguimientosConstructorTabla: any;
  banderaTablaSeguimientos: boolean = false;
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

  listarSeguimientosPorVigencia(
    vigenciaId: number,
    limit: number = this.itemsPerPage[0],
    offset: number = 0
  ) {
    console.log(this.role);
    this.seguimientosPorVigencia = [];

    //DATOS MOCK TEMPORAL
    const seguimientosMock = [
      {
        _id: "1",
        vigencia_nombre: "2024",
        titulo: "Auditoría de Gestión Financiera - Seguimiento",
        auditores_nombres: "Juan Pérez, María García",
        dependencia_nombre: "Dirección Financiera",
        lider_nombre: "Carlos Rodríguez",
        responsable_nombre: "Ana Martínez",
        estado_nombre: "En proceso",
        estado_id: 1,
        vigencia_id: vigenciaId,
        activo: true
      },
      {
        _id: "2",
        vigencia_nombre: "2024",
        titulo: "Auditoría de Recursos Humanos - Seguimiento",
        auditores_nombres: "Pedro López",
        dependencia_nombre: "Gestión Humana",
        lider_nombre: "Luis Hernández",
        responsable_nombre: "Sandra Gómez",
        estado_nombre: "Completado",
        estado_id: 2,
        vigencia_id: vigenciaId,
        activo: true
      },
      {
        _id: "3",
        vigencia_nombre: "2024",
        titulo: "Auditoría de Control Interno - Seguimiento",
        auditores_nombres: "Diana Torres, Roberto Díaz",
        dependencia_nombre: "Control Interno",
        lider_nombre: "Miguel Ángel Silva",
        responsable_nombre: "Patricia Ruiz",
        estado_nombre: "Pendiente",
        estado_id: 3,
        vigencia_id: vigenciaId,
        activo: true
      },
      {
        _id: "4",
        vigencia_nombre: "2024",
        titulo: "Auditoría de Compras y Contratación - Seguimiento",
        auditores_nombres: "Fernando Castro",
        dependencia_nombre: "Departamento de Compras",
        lider_nombre: "Gabriela Moreno",
        responsable_nombre: "Jorge Ramírez",
        estado_nombre: "En revisión",
        estado_id: 4,
        vigencia_id: vigenciaId,
        activo: true
      },
      {
        _id: "5",
        vigencia_nombre: "2024",
        titulo: "Auditoría de Tecnología - Seguimiento",
        auditores_nombres: "Carolina Vega, Andrés Mendoza",
        dependencia_nombre: "Tecnología e Informática",
        lider_nombre: "Ricardo Ortiz",
        responsable_nombre: "Mónica Vargas",
        estado_nombre: "Iniciado",
        estado_id: 1,
        vigencia_id: vigenciaId,
        activo: true
      },
      {
        _id: "6",
        vigencia_nombre: "2024",
        titulo: "Auditoría de Seguridad y Salud - Seguimiento",
        auditores_nombres: "Julián Rojas",
        dependencia_nombre: "Seguridad y Salud",
        lider_nombre: "Laura Sánchez",
        responsable_nombre: "Eduardo Jiménez",
        estado_nombre: "En proceso",
        estado_id: 1,
        vigencia_id: vigenciaId,
        activo: true
      },
      {
        _id: "7",
        vigencia_nombre: "2024",
        titulo: "Auditoría de Calidad - Seguimiento",
        auditores_nombres: "Beatriz Morales, Diego Campos",
        dependencia_nombre: "Gestión de Calidad",
        lider_nombre: "Alejandro Cruz",
        responsable_nombre: "Valeria Gutiérrez",
        estado_nombre: "Completado",
        estado_id: 2,
        vigencia_id: vigenciaId,
        activo: true
      },
      {
        _id: "8",
        vigencia_nombre: "2024",
        titulo: "Auditoría Ambiental - Seguimiento",
        auditores_nombres: "Natalia Pineda",
        dependencia_nombre: "Gestión Ambiental",
        lider_nombre: "Sergio Medina",
        responsable_nombre: "Claudia Ríos",
        estado_nombre: "Pendiente",
        estado_id: 3,
        vigencia_id: vigenciaId,
        activo: true
      },
      {
        _id: "9",
        vigencia_nombre: "2024",
        titulo: "Auditoría de Inventarios - Seguimiento",
        auditores_nombres: "Camilo Vargas",
        dependencia_nombre: "Almacén General",
        lider_nombre: "Paula Cortés",
        responsable_nombre: "Andrés Salazar",
        estado_nombre: "En proceso",
        estado_id: 1,
        vigencia_id: vigenciaId,
        activo: true
      },
      {
        _id: "10",
        vigencia_nombre: "2024",
        titulo: "Auditoría de Servicio al Cliente - Seguimiento",
        auditores_nombres: "Daniela Rojas, Felipe Gómez",
        dependencia_nombre: "Atención al Usuario",
        lider_nombre: "Marcela Peña",
        responsable_nombre: "Héctor Duarte",
        estado_nombre: "Completado",
        estado_id: 2,
        vigencia_id: vigenciaId,
        activo: true
      },
      {
        _id: "11",
        vigencia_nombre: "2024",
        titulo: "Auditoría de Procesos Administrativos - Seguimiento",
        auditores_nombres: "Rodrigo Mendoza",
        dependencia_nombre: "Administración",
        lider_nombre: "Sofía Arias",
        responsable_nombre: "Manuel Castro",
        estado_nombre: "Iniciado",
        estado_id: 1,
        vigencia_id: vigenciaId,
        activo: true
      },
      {
        _id: "12",
        vigencia_nombre: "2024",
        titulo: "Auditoría de Cumplimiento Legal - Seguimiento",
        auditores_nombres: "Isabel Navarro, Oscar Reyes",
        dependencia_nombre: "Jurídica",
        lider_nombre: "Cristian Torres",
        responsable_nombre: "Liliana Morales",
        estado_nombre: "En revisión",
        estado_id: 4,
        vigencia_id: vigenciaId,
        activo: true
      }
    ];

    // Simular respuesta del backend con paginación
    const inicio = offset;
    const fin = inicio + limit;
    const seguimientosPaginados = seguimientosMock.slice(inicio, fin);

    // Simular estructura de respuesta del backend
    const respuestaMock = {
      Data: seguimientosPaginados,
      MetaData: {
        Count: seguimientosMock.length
      }
    };

    // Procesar como si viniera del backend
    const seguimientos: any[] = respuestaMock.Data;

    if (!(seguimientos.length > 0)) {
      this.banderaTablaSeguimientos = false;
      this.seguimientosDataSource.data = [];
      return this.alertaService.showAlert(
        "No hay seguimientos registrados",
        "Actualmente no hay seguimientos registrados para la vigencia seleccionada."
      );
    }

    this.seguimientosPorVigencia = seguimientos;
    this.totalRegistros = respuestaMock.MetaData.Count;
    this.banderaTablaSeguimientos = true;
    this.construirTabla();

  }

  construirTabla() {
    this.seguimientosConstructorTabla = seguimientosConstructorTabla;
    this.tablaColumnas = this.seguimientosConstructorTabla.map(
      (column: any) => column.columnDef
    );

    this.seguimientosDataSource = new MatTableDataSource(
      this.seguimientosPorVigencia
    );

    //si no hay paginador, se crea
    if (!this.paginator) {
      this.seguimientosDataSource.paginator = this.paginator;
      this.seguimientosDataSource.sort = this.sort;
    }

    this.changeDetector.detectChanges();
  }

  manejarCambioPaginado(evento: PageEvent) {
    // Actualizar el índice de página y tamaño de página
    this.pageSize = evento.pageSize;
    this.pageIndex = evento.pageIndex;

    const offset = this.pageIndex * this.pageSize;
    this.listarSeguimientosPorVigencia(this.vigenciaId, this.pageSize, offset);
    // Actualizar el paginador después de realizar la consulta
    this.paginator.length = this.totalRegistros;
    this.paginator.pageSize = this.pageSize;
    this.paginator.pageIndex = this.pageIndex;
  }

  verDocumento(seguimiento: any) {
    console.log("Ver documento de seguimiento:", seguimiento);
  }

  editarInformeSeguimiento(seguimiento: any) {
    const seguimientoId = seguimiento._id;
    this.router.navigate([
      `/ejecucion/seguimiento-informes/editar-informe/${seguimientoId}`,
    ]);
  }
}