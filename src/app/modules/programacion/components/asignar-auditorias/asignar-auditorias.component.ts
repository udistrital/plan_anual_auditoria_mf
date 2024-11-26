import { Component } from "@angular/core";

@Component({
  selector: "app-asignar-auditorias",
  templateUrl: "./asignar-auditorias.component.html",
  styleUrls: ["./asignar-auditorias.component.css"],
})
export class AsignarAuditoriasComponent {
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
}
