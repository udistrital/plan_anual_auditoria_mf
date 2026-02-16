import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { TablaPlanMejoramientoComponent } from "./ tabla-plan-mejoramiento/tabla-plan-mejoramiento.component";
import { ImplicitAutenticationService } from "src/app/core/services/implicit_autentication.service";

@Component({
  selector: "app-plan-de-mejoramiento",
  templateUrl: "./plan-mejoramiento.component.html",
  styleUrls: ["./plan-mejoramiento.component.css"]
})
export class PlanDeMejoramientoComponent implements OnInit {
  @ViewChild(TablaPlanMejoramientoComponent)
  tablaPlanMejoramiento!: TablaPlanMejoramientoComponent;

  vigencias: any[] = [];
  tiposEvaluacion: any[] = [];
  planMejoramientoForm!: FormGroup;
  vigenciaSeleccionada!: number;
  tipoEvaluacionSeleccionado!: number;

  constructor(
    private fb: FormBuilder,
    private parametrosService: ParametrosService,
    private autenticacionService: ImplicitAutenticationService,
  ) {}

  ngOnInit() {
    this.iniciarForm();
    this.cargarVigencias();
    this.cargarTiposEvaluacion();
  }

  cargarVigencias() {
    this.parametrosService
      .get("parametro?query=TipoParametroId:121&fields=Id,Nombre&limit=0&sortby=nombre&order=desc")
      .subscribe((res) => {
        this.vigencias = res.Data;
      });
  }

  cargarTiposEvaluacion() {
    this.tiposEvaluacion = [
      { Id: 1, Nombre: "Interna" },
      { Id: 2, Nombre: "Externa" }
    ];
  }

  onVigenciaChange(vigencia: Vigencia) {
    this.vigenciaSeleccionada = vigencia.Id;
    this.buscarPlanes();
  }

  onTipoEvaluacionChange(tipoEvaluacion: any) {
    this.tipoEvaluacionSeleccionado = tipoEvaluacion.Id;
    this.buscarPlanes();
  }

  buscarPlanes() {
    if (this.vigenciaSeleccionada && this.tipoEvaluacionSeleccionado) {
      this.tablaPlanMejoramiento.listarPlanesPorFiltros(
        this.vigenciaSeleccionada,
        this.tipoEvaluacionSeleccionado
      );
    }
  }

  iniciarForm() {
    this.planMejoramientoForm = this.fb.group({
      vigencia: ["", Validators.required],
      tipoEvaluacion: ["", Validators.required],
    });
  }
}