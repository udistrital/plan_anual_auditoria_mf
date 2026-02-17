import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
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
    private parametrosUtilsService: ParametrosUtilsService,
  ) {}

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
