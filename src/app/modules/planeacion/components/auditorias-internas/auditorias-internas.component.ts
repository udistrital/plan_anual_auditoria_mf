import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { AlertService } from "src/app/shared/services/alert.service";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { TablaAuditoriasInternasComponent } from "./tabla-auditorias-internas/tabla-auditorias-internas.component";

@Component({
  selector: "app-auditorias-internas",
  templateUrl: "./auditorias-internas.component.html",
  styleUrl: "./auditorias-internas.component.css",
})
export class AuditoriasInternasComponent implements OnInit {
  @ViewChild(TablaAuditoriasInternasComponent)
  tablaAuditorias!: TablaAuditoriasInternasComponent;

  vigencias: any[] = [];
  vigenciaForm!: FormGroup;
  vigenciaSeleccionada!: number;

  constructor(
    private fb: FormBuilder,
    private parametrosService: ParametrosService
  ) {}

  ngOnInit() {
    this.iniciarvigenciaForm();
    this.cargarVigencias();
  }

  cargarVigencias() {
    this.parametrosService
      .get(
        "parametro?query=TipoParametroId:121&fields=Id,Nombre&limit=0&sortby=nombre&order=desc"
      )
      .subscribe((res) => {
        this.vigencias = res.Data;
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
