import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { TablaAuditoriasExternasComponent } from "./tabla-auditorias-externas/tabla-auditorias-externas.component";

@Component({
  selector: "app-auditorias-externas",
  templateUrl: "./auditorias-externas.component.html",
  styleUrls: ["./auditorias-externas.component.css"]
})
export class AuditoriasExternasComponent implements OnInit {
  @ViewChild(TablaAuditoriasExternasComponent)
  tablaAuditorias!: TablaAuditoriasExternasComponent;

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
  }

  iniciarvigenciaForm() {
    this.vigenciaForm = this.fb.group({
      vigencia: ["", Validators.required],
    });
  }
}
