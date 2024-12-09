import { UserService } from './../../../../../core/services/user.service';
import { AutenticacionMidService } from './../../../../../core/services/autenticacion-mid.service';
import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormArray, FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { Parametro } from "src/app/shared/data/models/parametros/parametros";
import { Auditoria } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { AlertService } from "src/app/shared/services/alert.service";

interface Auditor {
  nombre: string;
  documento: number;
  //id: number;
}
@Component({
  selector: "app-formulario-auditoria-especial",
  templateUrl: "./formulario-auditoria-especial.component.html",
  styleUrls: ["./formulario-auditoria-especial.component.css"],
})


export class FormularioAuditoriaEspecialComponent implements OnInit {
  form: FormGroup | any;
  evaluaciones: Parametro[] = [];
  auditores: Auditor[] = [];
  auditoresSeleccionados: FormArray<FormGroup>;
  meses: Parametro[] = [];
  TODOS = "Todos";
  usuarioId: any;
  isEditMode = false;

  constructor(
    private alertaService: AlertService,
    private fb: FormBuilder,
    private parametrosService: ParametrosService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    public dialogRef: MatDialogRef<FormularioAuditoriaEspecialComponent>,
    private AutenticacionMidService: AutenticacionMidService,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: { auditoria?: Auditoria }
  ) {
    this.auditoresSeleccionados =this.fb.array<FormGroup>([]);
  }

  ngOnInit(): void {
    this.isEditMode = !!this.data.auditoria;
    this.userService.getPersonaId().then((usuarioId) => {
    this.usuarioId = usuarioId;
    });
    //this.auditoresSeleccionados = this.fb.array([]);
    this.form = this.fb.group({
      tituloAuditoria: [this.data.auditoria?.auditoria || ""],
      tipoEvaluacion: [this.data.auditoria?.tipoEvaluacion || []],
      cronogramaActividades: [this.data.auditoria?.cronograma || []],
      auditoresSeleccionados: this.auditoresSeleccionados,
      auditor: [""],
    });
    this.CargarEvaluaciones();
    this.CargarMeses();
    this.CargarAuditores();
    console.log("usuario Logeado", this.usuarioId);
  }

  agregarAuditor() {
    this.auditoresSeleccionados.push(
      this.fb.group({
        auditor: this.fb.control<Auditor | null>(null),
        lider: this.fb.control<boolean>(false),
      })
      );
  }

  eliminarAuditor(index: number) {
    this.auditoresSeleccionados.removeAt(index);
  }

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

  CargarAuditores() {
    this.AutenticacionMidService.get("rol/periods").subscribe((res) => {
      console.log("res", res);
      if (res && res.Data) {
        this.auditores = res.Data
        .filter((auditor: any) => auditor.finalizado === false &&
        ["AUDITOR", "AUDITOR_EXPERTO"].includes(auditor.rol_usuario))  
        .map((auditor: any) => ({
          nombre: auditor.nombre,
          documento: auditor.documento
          //id: auditor.id_tercero
      }));        
      }
      console.log("Auditores", this.auditores);
    });
  }

  auditoresDisponibles(index: number): Auditor[] {
    const seleccionados = this.auditoresSeleccionados.value
      .filter((_, i) => i !== index)
      .map((control: {auditor: Auditor }) => control.auditor?.documento);

    return this.auditores.filter((auditor) => !seleccionados.includes(auditor.documento));
  }

  onLiderChange(selectedIndex: number): void {
    this.auditoresSeleccionados.controls.forEach((control, index) => {
      if (index !== selectedIndex) {
        control.get('lider')?.setValue(false);
      }
    });
  }

  asignarAuditor(auditorSleccionado: any): void {
    const auditorPayload = {
      auditoria_id: this.data.auditoria?.id,
      auditor_id: auditorSleccionado.id,
      asignado: true,
      asignado_por_id: 1,
      auditor_lider: auditorSleccionado.lider
    };
    console.log("auditorPayload", auditorPayload);

    this.planAnualAuditoriaService.post("auditor", auditorPayload).subscribe({
      next: (response: any) => {
        if (response.Status === 201 || response.Status === 200) {
          console.log("Auditor asignado exitosamente", response);          
        }else{
          console.error("Error al asignar auditor", response);
        }
      },
      error: (err) => {
        console.error("error al asignar auditor", err);
      }

    });
  }

  onSave() {
    if (this.form.valid) {
      this.alertaService
        .showConfirmAlert(`¿Está seguro(a) de actualizar la auditoría?`)
        .then((result) => {
          if (result.isConfirmed) {
            console.log("auditoria id", this.data.auditoria!.id);
            // const audiroresId = this.form.value.auditoresSeleccionados.map(
            //   (auditor: Auditor) => auditor.documento
            // );
            const auditoresSeleccionados = this.auditoresSeleccionados.value.map(
              (item: {auditor: Auditor | null; lider: boolean}) =>  ({
                documento: item.auditor?.documento || 0,
                lider: item.lider
              })
            );
            //console.log("AuditoresDoc", audiroresId);
            const formData = {
              titulo: this.form.value.tituloAuditoria,
              tipo_evaluacion_id: this.form.value.tipoEvaluacion,
              cronograma_id: this.form.value.cronogramaActividades,
              auditores: auditoresSeleccionados
              
            };

            console.log("formData", formData);

            this.planAnualAuditoriaService
              .put(`auditoria/${this.data.auditoria!.id}`, formData)
              .subscribe({
                next: (response: any) => {
                  if (response.Status === 200) {
                    this.alertaService.showSuccessAlert(
                      `Auditoría actualizada exitosamente.`
                    );
                    this.dialogRef.close({ saved: true });
                  } else {
                    this.alertaService.showSuccessAlert(
                      `Error al actualizar la auditoría. Código de estado inesperado: ${response.Status}`
                    );
                  }
                },
                error: (err) => {
                  this.alertaService.showErrorAlert(
                    `Error al actualizar la auditoría. Inténtelo de nuevo.`
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
