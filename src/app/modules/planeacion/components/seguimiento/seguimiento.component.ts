import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
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
    private parametrosUtilsService: ParametrosUtilsService
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
