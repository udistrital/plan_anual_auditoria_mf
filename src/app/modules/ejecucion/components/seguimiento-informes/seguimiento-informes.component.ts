import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { TablaSeguimientosComponent } from "./tabla-segumiento/tabla-seguimientos.component";

@Component({
  selector: "app-seguimiento-informes",
  templateUrl: "./seguimiento-informes.component.html",
  styleUrls: ["./seguimiento-informes.component.css"]
})
export class SeguimientoInformesComponent implements OnInit {
  @ViewChild(TablaSeguimientosComponent)
  tablaSeguimientos!: TablaSeguimientosComponent;

  vigencias: any[] = [];
  vigenciaForm!: FormGroup;
  vigenciaSeleccionada!: number;

  constructor(
    private fb: FormBuilder,
    private parametrosService: ParametrosService,
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

  mostrarSeguimientosPorVigencia(vigencia: Vigencia) {
    this.vigenciaSeleccionada = vigencia.Id;
    this.tablaSeguimientos.listarSeguimientosPorVigencia(this.vigenciaSeleccionada);
  }

  iniciarvigenciaForm() {
    this.vigenciaForm = this.fb.group({
      vigencia: ["", Validators.required],
    });
  }
}
