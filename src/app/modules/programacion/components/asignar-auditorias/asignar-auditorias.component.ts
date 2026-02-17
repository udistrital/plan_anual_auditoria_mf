import { Component, OnInit, ViewChild } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { TablaConsultaAuditoriasComponent } from "./tabla-consulta-auditorias/tabla-consulta-auditorias.component";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";

@Component({
  selector: "app-asignar-auditorias",
  templateUrl: "./asignar-auditorias.component.html",
  styleUrls: ["./asignar-auditorias.component.css"],
})
export class AsignarAuditoriasComponent implements OnInit {
  @ViewChild(TablaConsultaAuditoriasComponent)
  tablaAuditorias!: TablaConsultaAuditoriasComponent;

  vigencias: any[] = [];
  vigenciaForm!: FormGroup;
  vigenciaSeleccionada!: number;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private parametrosUtilsService: ParametrosUtilsService
  ) {}

  ngOnInit() {
    this.iniciarvigenciaForm();
    this.cargarVigencias();
  }

  fechaAsignacion: Date | null = null;

  cargarVigencias() {
    this.parametrosUtilsService.getVigencias().subscribe({
      next: (data) => {
        this.vigencias = data;
      },
      error: (err) => {
        console.error("Error load vigencias", err);
      }
    });
  }

  mostrarAuditoriasPorVigencia(vigencia: Vigencia) {
    this.vigenciaSeleccionada = vigencia.Id;
    this.tablaAuditorias.listarAuditoriasPorVigencia(this.vigenciaSeleccionada);
  }

  iniciarvigenciaForm() {
    this.vigenciaForm = this.fb.group({
      vigencia: ["", Validators.required],
    });
  }

}
