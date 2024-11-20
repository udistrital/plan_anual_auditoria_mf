import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Vigencia } from "src/app/data/models/vigencia.model";
import { AlertService } from "src/app/services/alert.service";
import { ParametrosService } from "src/app/services/parametros.service";
import { PlanAnualAuditoriaMid } from "src/app/services/plan-anual-auditoria-mid.service";

@Component({
  selector: "app-auditorias-internas",
  templateUrl: "./auditorias-internas.component.html",
  styleUrl: "./auditorias-internas.component.css",
})
export class AuditoriasInternasComponent implements OnInit {
  auditoriasPorVigencia: any[] = [];
  banderaTablaAuditoriasInternas: boolean = false;
  vigenciaForm!: FormGroup;
  vigencias: any[] = [];

  constructor(
    private fb: FormBuilder,
    private parametrosService: ParametrosService,
    private planAuditoriaMid: PlanAnualAuditoriaMid,
    private alertaService: AlertService
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

  listarAuditoriasPorVigencia(vigencia: Vigencia) {
    const vigenciaId = vigencia.Id;
    this.auditoriasPorVigencia = [];
    this.banderaTablaAuditoriasInternas = false;

    this.planAuditoriaMid
      .get(`auditoria/vigencia/${vigenciaId}`)
      .subscribe((res) => {
        const auditorias: any[] = res.Data;

        if (!(auditorias.length > 0)) {
          return this.alertaService.showAlert(
            "No hay auditorías registradas",
            "Actualmente no hay auditorías registradas para la vigencia seleccionada."
          );
        }

        this.auditoriasPorVigencia = auditorias;
        this.banderaTablaAuditoriasInternas = true;
      });
  }

  iniciarvigenciaForm() {
    this.vigenciaForm = this.fb.group({
      vigencia: ["", Validators.required],
    });
  }
}
