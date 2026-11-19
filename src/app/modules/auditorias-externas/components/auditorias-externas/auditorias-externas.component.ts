import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { TablaAuditoriasExternasComponent } from "./tabla-auditorias-externas/tabla-auditorias-externas.component";

@Component({
    selector: "app-auditorias-externas",
    templateUrl: "./auditorias-externas.component.html",
    styleUrls: ["./auditorias-externas.component.css"],
    standalone: false
})
export class AuditoriasExternasComponent implements OnInit {
  @ViewChild(TablaAuditoriasExternasComponent)
  tablaAuditorias!: TablaAuditoriasExternasComponent;

  vigencias: any[] = [];
  vigenciaForm!: FormGroup;
  vigenciaSeleccionada?: number;

  constructor(
    private readonly fb: FormBuilder,
    private readonly parametrosUtilsService: ParametrosUtilsService,
    private readonly router: Router,
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

  /** Abre el registro de una auditoría externa; si hay vigencia elegida, llega preseleccionada. */
  crearAuditoria() {
    this.router.navigate(["/auditorias-externas/registrar-auditoria"], {
      queryParams: this.vigenciaSeleccionada ? { vigencia: this.vigenciaSeleccionada } : {},
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
