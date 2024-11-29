import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { CargarArchivoComponent } from "src/app/shared/elements/components/cargar-archivo/cargar-archivo.component";

@Component({
  selector: "app-actividades-auditoria",
  templateUrl: "./actividades-auditoria.component.html",
  styleUrls: ["./actividades-auditoria.component.css"],
})
export class ActividadesAuditoriaComponent implements OnInit {
  datos = [
    {
      actividad: "Título de la actividad 1",
      fechaInicio: "2024-01-01",
      fechaFin: "2024-01-10",
      ref: "Ref 1",
      descripcion: "Descripción 1",
      folios: "10",
      medio: "Digital",
      carpeta: "Carpeta A",
    },
    {
      actividad: "Título de la actividad 2",
      fechaInicio: "2024-02-01",
      fechaFin: "2024-02-05",
      ref: "Ref 2",
      descripcion: "Descripción 2",
      folios: "15",
      medio: "Físico",
      carpeta: "Carpeta B",
    },
  ];
  columnsToDisplay: string[] = [
    "no",
    "actividad",
    "fechaInicio",
    "fechaFin",
    "papelesTrabajo",
  ];

  constructor(public dialog: MatDialog) {}

  resetComponent() {}
  onStepLeave() {
    this.resetComponent();
  }
  ngOnInit(): void {}

  subirArchivo(tipoArchivo: string): void {
    const dialogRef = this.dialog.open(CargarArchivoComponent, {
      width: "600px",
      data: { tipoArchivo },
    });
  }
}
