import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { TablaAuditoriasInternasComponent } from "./tabla-auditorias-internas/tabla-auditorias-internas.component";

@Component({
  selector: "app-auditorias-internas",
  templateUrl: "./auditorias-internas.component.html",
  styleUrls: ["./auditorias-internas.component.css"]
})
export class AuditoriasInternasComponent implements OnInit {
  @ViewChild(TablaAuditoriasInternasComponent)
  tablaAuditorias!: TablaAuditoriasInternasComponent;

  vigencias: any[] = [];
  vigenciaForm!: FormGroup;
  vigenciaSeleccionada!: number;

  constructor(
    private fb: FormBuilder,
    private parametrosUtilsService: ParametrosUtilsService,
  ) { }

  ngOnInit() {
    this.iniciarvigenciaForm();
    this.cargarVigencias();
  }

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
