import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { ParametrosUtilsService } from "src/app/shared/services/parametros.service";
import { TablaSeguimientosComponent } from "./tabla-segumiento/tabla-seguimientos.component";
import { ImplicitAutenticationService } from "src/app/core/services/implicit_autentication.service";

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
  role: string | null = null;
  IsSecretario = false;
  IsAuditor = false;
  IsJefe = false;

  constructor(
    private fb: FormBuilder,
    private parametrosUtilsService: ParametrosUtilsService,
    private autenticacionService: ImplicitAutenticationService,
  ) {}

  ngOnInit() {
    this.buscarRol();
    this.iniciarvigenciaForm();
    this.cargarVigencias();
  }

  buscarRol() {
    this.autenticacionService.getRole().then((roles: any) => {
      if (!roles || roles.length === 0) {
        console.error("No se encontraron roles para este usuario");
        return;
      }

      this.IsSecretario = roles.includes("SECRETARIO_AUDITOR");
      this.IsAuditor = roles.some((role: string) => role === "AUDITOR_EXPERTO" || role === "AUDITOR");
      this.IsJefe = roles.includes("JEFE_CONTROL_INTERNO");

      this.role = this.IsSecretario
        ? "secretario"
        : this.IsAuditor
          ? "auditor"
          : this.IsJefe
            ? "jefe"
            : null;

      if (this.IsAuditor) {
        this.cargarVigencias();
      }
      console.log("Rol actual:", this.role);
    });
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