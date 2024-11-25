import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { Parametro } from "src/app/shared/data/models/parametros/parametros";
import { Auditoria } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { ModalService } from "src/app/shared/services/modal.service";

@Component({
  selector: "app-formulario-auditoria-especial",
  templateUrl: "./formulario-auditoria-especial.component.html",
  styleUrls: ["./formulario-auditoria-especial.component.css"],
})
export class FormularioAuditoriaEspecialComponent implements OnInit {
  form: FormGroup | any;
  evaluaciones: Parametro[] = [];
  auditores = ["Pepito Pérez", "Juanita Gómez"];
  meses: Parametro[] = [];
  TODOS = "Todos";
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private parametrosService: ParametrosService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    public dialogRef: MatDialogRef<FormularioAuditoriaEspecialComponent>,
    private modalService: ModalService,
    @Inject(MAT_DIALOG_DATA) public data: { auditoria?: Auditoria }
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data.auditoria;
    this.form = this.fb.group({
      tituloAuditoria: [this.data.auditoria?.auditoria || ""],
      tipoEvaluacion: [this.data.auditoria?.tipoEvaluacion || []],
      cronogramaActividades: [this.data.auditoria?.cronograma || []],
      auditor: [""],
    });
    this.CargarEvaluaciones();
    this.CargarMeses();
  }

  agregarAuditor() {}

  CargarMeses() {
    this.parametrosService
      .get("parametro?query=TipoParametroId:139&limit=0")
      .subscribe((res) => {
        if (res !== null) {
          this.meses = res.Data;
        }
      });
  }

  CargarEvaluaciones() {
    this.parametrosService
      .get("parametro?query=TipoParametroId:136&limit=0")
      .subscribe((res) => {
        if (res !== null) {
          this.evaluaciones = res.Data;
        }
      });
  }

  asignarTodos(): void {
    const seleccion = [this.TODOS];
    this.form.get("cronogramaActividades").setValue(seleccion);
  }

  onMesChange(): void {
    const seleccionados = this.form.get("cronogramaActividades").value;

    if (seleccionados.includes(this.TODOS) && seleccionados.length > 1) {
      this.form
        .get("cronogramaActividades")
        .setValue(seleccionados.filter((mes: string) => mes !== this.TODOS));
    }

    if (seleccionados.length === 0) {
      this.form.get("cronogramaActividades").setValue([this.TODOS]);
    }
  }

  onSave() {
    if (this.form.valid) {
      this.modalService
        .modalConfirmacion(
          "Confirmación",
          "warning",
          `¿Está seguro(a) de actualizar la auditoría?`
        )
        .then((result) => {
          if (result.isConfirmed) {
            console.log("auditoria id", this.data.auditoria!.id);
            const formData = {
              titulo: this.form.value.tituloAuditoria,
              tipo_evaluacion_id: this.form.value.tipoEvaluacion,
              cronograma_id: this.form.value.cronogramaActividades,
            };

            this.planAnualAuditoriaService
              .put(`/auditoria/${this.data.auditoria!.id}`, formData)
              .subscribe({
                next: (response: any) => {
                  if (response.Status === 200) {
                    this.modalService.mostrarModal(
                      `Auditoría actualizada exitosamente.`,
                      "success",
                      "AUDITORIA ACTUALIZADA"
                    );
                    this.dialogRef.close({ saved: true });
                  } else {
                    this.modalService.mostrarModal(
                      `Error al actualizar la auditoría. Código de estado inesperado: ${response.Status}`,
                      "error",
                      "ERROR"
                    );
                  }
                },
                error: (err) => {
                  this.modalService.mostrarModal(
                    `Error al actualizar la auditoría. Inténtelo de nuevo.`,
                    "error",
                    "ERROR"
                  );
                },
              });
          }
        });
    } else {
      console.log("Formulario no valido");
      this.form.markAllAsTouched();
    }
  }

  guardar() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
