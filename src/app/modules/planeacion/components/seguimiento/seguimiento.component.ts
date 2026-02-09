import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { TablaSeguimientoComponent } from "./tabla-seguimiento/tabla-seguimiento.component";

@Component({
  selector: "app-seguimiento",
  templateUrl: "./seguimiento.component.html",
  styleUrl: "./seguimiento.component.css",
})
export class SeguimientoComponent implements OnInit {
  @ViewChild(TablaSeguimientoComponent)
  tablaSeguimiento!: TablaSeguimientoComponent;

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
    this.tablaSeguimiento.listarAuditoriasPorVigencia(this.vigenciaSeleccionada);
  }

  iniciarvigenciaForm() {
    this.vigenciaForm = this.fb.group({
      vigencia: ["", Validators.required],
    });
  }
}
