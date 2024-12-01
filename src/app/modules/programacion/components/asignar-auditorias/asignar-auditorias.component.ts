import { Component } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Auditoria } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria";
import { ModalAgregarAuditorComponent } from "./modal-agregar-auditor/modal-agregar-auditor.component";

@Component({
  selector: "app-asignar-auditorias",
  templateUrl: "./asignar-auditorias.component.html",
  styleUrls: ["./asignar-auditorias.component.css"],
})
export class AsignarAuditoriasComponent {

  constructor(
    private dialog: MatDialog,
  ) {}

  fechaAsignacion: Date | null = null;

  datos = [
    {
      no: 1,
      auditoria: "titulo",
      tipoEvaluacion: "Auditoria Interna",
      auditor: "",
      cronogramaActividades: "Mes",
      estado: "Sin Iniciar",
    },
    {
      no: 2,
      auditoria: "titulo",
      tipoEvaluacion: "seguimiento",
      auditor: "pepito perez",
      cronogramaActividades: "Mes",
      estado: "Sin Iniciar",
    },
    {
      no: 4,
      auditoria: "titulo",
      tipoEvaluacion: "seguimiento",
      auditor: "",
      cronogramaActividades: "Mes",
      estado: "Sin Iniciar",
    },
    {
      no: 5,
      auditoria: "titulo",
      tipoEvaluacion: "seguimiento",
      auditor: "",
      cronogramaActividades: "Mes",
      estado: "Sin Iniciar",
    },
    {
      no: 6,
      auditoria: "titulo",
      tipoEvaluacion: "informe",
      auditor: "",
      cronogramaActividades: "Mes",
      estado: "Sin Iniciar",
    },
  ];
  columnsToDisplay: string[] = [
    "no",
    "auditoria",
    "tipoEvaluacion",
    "auditor",
    "cronogramaActividades",
    "estado",
    "acciones",
  ];
  year: number = new Date().getFullYear();

  agregarAuditor(auditoria?: Auditoria) {
    const dialogRef = this.dialog.open(ModalAgregarAuditorComponent, {
      width: "1100px",
      data: {
        auditoria,
      },
    });

  }

}
