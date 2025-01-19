import { Component, OnInit, ViewChild } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Auditoria } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria";
import { ModalAgregarAuditorComponent } from "./modal-agregar-auditor/modal-agregar-auditor.component";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { Vigencia } from "src/app/shared/data/models/vigencia.model";
import { TablaConsultaAuditoriasComponent } from "./tabla-consulta-auditorias/tabla-consulta-auditorias.component";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";

@Component({
  selector: "app-asignar-auditorias",
  templateUrl: "./asignar-auditorias.component.html",
  styleUrls: ["./asignar-auditorias.component.css"],
})
export class AsignarAuditoriasComponent implements OnInit {
  @ViewChild(TablaConsultaAuditoriasComponent)
  tablaAuditorias!: TablaConsultaAuditoriasComponent;

  vigencias: any[] = [];
  vigenciaForm!: FormGroup;
  vigenciaSeleccionada!: number;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private parametrosService: ParametrosService
  ) {}

  ngOnInit() {
    this.iniciarvigenciaForm();
    this.cargarVigencias();
  }

  fechaAsignacion: Date | null = null;

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
