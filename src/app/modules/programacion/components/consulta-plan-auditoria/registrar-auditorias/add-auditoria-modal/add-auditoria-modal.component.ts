import { Component, OnInit, Inject } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { Parametro } from "src/app/shared/data/models/parametros/parametros";
import { Auditoria } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-add-auditoria-modal",
  templateUrl: "./add-auditoria-modal.component.html",
  styleUrls: ["./add-auditoria-modal.component.css"], 
})
export class AddAuditoriaModalComponent implements OnInit {
  auditoriaForm: FormGroup | any;
  evaluaciones: Parametro[] = [];
  meses: Parametro[] = [];
  isEditMode = false;
  TODOS = "Todos";

  constructor(
    private alertaService: AlertService,
    private fb: FormBuilder,
    private parametrosService: ParametrosService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    public dialogRef: MatDialogRef<AddAuditoriaModalComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { usuario_id: number; usuario_rol: string; planAuditoriaId: string; vigenciaId: number; auditoria?: Auditoria }
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data.auditoria;
    this.auditoriaForm = this.fb.group({
      tituloActividad: [
        this.data.auditoria?.auditoria || "",
        Validators.required,
      ],
      tipoEvaluacion: [
        this.data.auditoria?.tipoEvaluacionId || [],
        Validators.required,
      ],
      cronogramaActividades: [
        this.data.auditoria?.cronogramaId || [],
        Validators.required,
      ],
    });

    this.cargarVigencia();
    this.cargarMeses();
  }

  cargarMeses(callback?: () => void) {
    this.parametrosService
      .get("parametro?query=TipoParametroId:139&limit=0")
      .subscribe((res) => {
        if (res && res.Data) {
          this.meses = res.Data;
          if (callback) callback();
        }
      });
  }

  cargarVigencia(callback?: () => void) {
    this.parametrosService
      .get("parametro?query=TipoParametroId:136&limit=0")
      .subscribe((res) => {
        if (res && res.Data) {
          this.evaluaciones = res.Data;
          if (callback) callback();
        }
      });
  }

  asignarTodos(): void {
    const seleccion = [this.TODOS];
    this.auditoriaForm.get("cronogramaActividades").setValue(seleccion);
  }

  cambioMes(): void {
    const seleccionados = this.auditoriaForm.get("cronogramaActividades").value;

    if (seleccionados.includes(this.TODOS) && seleccionados.length > 1) {
      this.auditoriaForm
        .get("cronogramaActividades")
        .setValue(seleccionados.filter((mes: string) => mes !== this.TODOS));
    }

    if (seleccionados.length === 0) {
      this.auditoriaForm.get("cronogramaActividades").setValue([this.TODOS]);
    }
  }

  guardarAuditoria(): void {
    if (this.auditoriaForm.valid) {
      this.alertaService
        .showConfirmAlert(
          `¿Está seguro(a) de ${
            this.isEditMode ? "actualizar" : "guardar"
          } la auditoría?`
        )
        .then((result) => {
          if (result.isConfirmed) {
            const formData = {
              plan_auditoria_id: this.data.planAuditoriaId,
              titulo: this.auditoriaForm.value.tituloActividad,
              tipo_evaluacion_id: this.auditoriaForm.value.tipoEvaluacion,
              cronograma_id: this.auditoriaForm.value.cronogramaActividades,
              vigencia_id: this.data.vigenciaId
            };

            const estadoInicial = {
              usuario_id: this.data.usuario_id,
              usuario_rol: this.data.usuario_rol,
              fase_id: environment.AUDITORIA_FASE.PROGRAMACION,
              estado_id: environment.AUDITORIA_ESTADO.PROGRAMACION.BORRADOR_ID,
            };

            const request$ = this.isEditMode
              ? this.planAnualAuditoriaService.put(
                  `auditoria/${this.data.auditoria!.id}`,
                  formData
                )
              : this.planAnualAuditoriaService.post("auditoria-gestion", {...formData, ...estadoInicial});

            request$.subscribe({
              next: (response) => {
                this.alertaService.showSuccessAlert(
                  `Auditoría ${
                    this.isEditMode ? "actualizada" : "guardada"
                  } exitosamente.`
                );
                this.dialogRef.close({ saved: true });
              },
              error: (error) => {
                this.alertaService.showErrorAlert(
                  `Error al ${
                    this.isEditMode ? "actualizar" : "guardar"
                  } la auditoría. Inténtelo de nuevo.`
                );
              },
            });
          }
        });
    } else {
      console.log("El formulario es inválido");
      this.auditoriaForm.markAllAsTouched();
    }
  }
}
