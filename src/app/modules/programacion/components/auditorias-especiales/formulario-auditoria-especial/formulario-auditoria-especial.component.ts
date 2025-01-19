import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { UserService } from "./../../../../../core/services/user.service";
import { AutenticacionMidService } from "./../../../../../core/services/autenticacion-mid.service";
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
  id: number;
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
    private PlanAnualAuditoriaMid: PlanAnualAuditoriaMid,
    public dialogRef: MatDialogRef<FormularioAuditoriaEspecialComponent>,
    private AutenticacionMidService: AutenticacionMidService,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: { auditoria?: Auditoria }
  ) {
    this.auditoresSeleccionados = this.fb.array<FormGroup>([]);
  }

  ngOnInit(): void {
    this.isEditMode = !!this.data.auditoria;
    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
      console.log("usuario Logeado", this.usuarioId, usuarioId);
    });
    //this.auditoresSeleccionados = this.fb.array([]);
    this.form = this.fb.group({
      tituloAuditoria: [this.data.auditoria?.auditoria || ""],
      tipoEvaluacion: [this.data.auditoria?.tipoEvaluacionId || []],
      cronogramaActividades: [this.data.auditoria?.cronogramaId || []],
      auditoresSeleccionados: this.auditoresSeleccionados,
      auditor: [""],
    });
    this.CargarEvaluaciones();
    this.cargarMeses();
    this.cargarAuditores();
  }

  inicializarAuditoresSeleccionados(): void {
    this.PlanAnualAuditoriaMid.get(
      `auditor?query=auditoria_id:${this.data.auditoria?.id},activo:true`
    ).subscribe(
      (res) => {
        this.auditoresSeleccionados.clear();
        const auditoresAsignados: any[] = res.Data || [];
        console.log("auditoresAsignadosConsulta", auditoresAsignados);

        auditoresAsignados.forEach((auditorAsignado) => {
          const auditorEncontrado = this.auditores.find(
            (a) => a.id === auditorAsignado.auditor_id
          );

          if (auditorEncontrado) {
            console.log("auditorEncontrado", auditorEncontrado);
            const auditorControl = this.fb.group({
              auditor: this.fb.control<Auditor | null>(auditorEncontrado),
              lider: this.fb.control<boolean>(
                auditorAsignado.auditor_lider || false
              ),
            });

            this.auditoresSeleccionados.push(auditorControl);
          } else {
            console.warn(
              `Auditor con ID ${auditorAsignado.auditor_id} no encontrado en la lista de auditores.`
            );
          }
        });
      },
      (error) => {
        console.error("Error al cargar auditores asignados:", error);
      }
    );
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
    const auditorSeleccionado = this.auditoresSeleccionados.at(index)?.value;
    console.log("Auditor seleccionado para eliminar:", auditorSeleccionado);

    this.alertaService
      .showConfirmAlert(`¿Está seguro de eliminar este auditor?`)
      .then((result) => {
        if (result.isConfirmed) {
          this.PlanAnualAuditoriaMid.get(
            `auditor?query=auditoria_id:${this.data.auditoria?.id},activo:true,auditor_id:${auditorSeleccionado.auditor.id}`
          ).subscribe((res) => {
            const auditorEliminar = res.Data[0] || null;
            console.log("auditorEliminar", auditorEliminar._id);
            const idAuditor = auditorEliminar._id;

            if (auditorEliminar) {
              console.log("auditorIdEliminar", idAuditor);
              this.planAnualAuditoriaService
                .delete("auditor", idAuditor)
                .subscribe({
                  next: (deleteResponse: any) => {
                    console.log("Auditor eliminado crud", deleteResponse);

                    this.auditoresSeleccionados.removeAt(index);
                    console.log(
                      "Lista de auditores después de eliminar:",
                      this.auditoresSeleccionados.value
                    );
                    this.alertaService.showSuccessAlert(
                      "Auditor eliminado correctamente."
                    );
                  },
                  error: (err) => {
                    console.error("Error al eliminar auditor", err);
                    this.alertaService.showErrorAlert(
                      "Error al eliminar el auditor. Inténtelo de nuevo."
                    );
                  },
                });
            } else {
              this.auditoresSeleccionados.removeAt(index);
              console.log("no eliminado, retirado de la lista");
              console.log(
                "Lista de auditores luego de retirar:",
                this.auditoresSeleccionados.value
              );
              this.alertaService.showSuccessAlert(
                "Auditor eliminado correctamente."
              );
            }
          });
        }
      });
  }

  cargarMeses() {
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

  cambioMes(): void {
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

  cargarAuditores() {
    this.AutenticacionMidService.get("rol/periods").subscribe((res) => {
      console.log("res", res);
      if (res && res.Data) {
        this.auditores = res.Data.filter(
          (auditor: any) =>
            auditor.finalizado === false &&
            ["AUDITOR", "AUDITOR EXPERTO"].includes(auditor.rol_usuario)
        ).map((auditor: any) => ({
          nombre: auditor.nombre,
          documento: auditor.documento,
          id: auditor.id_tercero,
        }));
      }
      this.inicializarAuditoresSeleccionados();
      console.log("Auditores", this.auditores);
    });
  }

  auditoresDisponibles(index: number): Auditor[] {
    const seleccionados = this.auditoresSeleccionados.value
      .filter((_, i) => i !== index)
      .map((control: { auditor: Auditor }) => control.auditor?.documento);

    return this.auditores.filter(
      (auditor) => !seleccionados.includes(auditor.documento)
    );
  }

  onLiderChange(selectedIndex: number): void {
    this.auditoresSeleccionados.controls.forEach((control, index) => {
      if (index !== selectedIndex) {
        control.get("lider")?.setValue(false);
      }
    });
  }

  asignarAuditor(auditorSeleccionado: any): void {
    const auditorPayload = {
      auditoria_id: this.data.auditoria?.id,
      auditor_id: auditorSeleccionado.id,
      asignado: true,
      asignado_por_id: this.usuarioId,
      auditor_lider: auditorSeleccionado.lider,
    };

    console.log("auditorPayload", auditorPayload);

    this.PlanAnualAuditoriaMid.get(
      `auditor?query=auditoria_id:${this.data.auditoria?.id},activo:true,auditor_id:${auditorPayload.auditor_id}`
    ).subscribe((res) => {
      const auditorAsignado = res.Data[0] || null;

      if (auditorAsignado) {
        this.planAnualAuditoriaService
          .put(`auditor/${auditorAsignado._id}`, auditorPayload)
          .subscribe({
            next: (updateResponse: any) => {
              console.log("Auditor actualizado exitosamente", updateResponse);
            },
            error: (err) => {
              console.error("Error al actualizar auditor", err);
            },
          });
      } else {
        this.planAnualAuditoriaService
          .post("auditor", auditorPayload)
          .subscribe({
            next: (response: any) => {
              console.log("Auditor asignado exitosamente", response);
            },
            error: (err) => {
              console.error("Error al asignar auditor", err);
            },
          });
      }
    });
  }

  guardarAuditoria() {
    if (this.form.valid) {
      this.alertaService
        .showConfirmAlert(`¿Está seguro(a) de actualizar la auditoría?`)
        .then((result) => {
          if (result.isConfirmed) {
            console.log("auditoria id", this.data.auditoria!.id);

            const auditoresSeleccionados =
              this.auditoresSeleccionados.value.map(
                (item: { auditor: Auditor | null; lider: boolean }) => ({
                  documento: item.auditor?.documento || 0,
                  lider: item.lider,
                  id: item.auditor?.id,
                })
              );
            console.log("AuditoresSelecc", auditoresSeleccionados);

            auditoresSeleccionados.forEach((auditor) => {
              if (auditor.documento) {
                console.log("auditor", auditor);
                this.asignarAuditor(auditor);
              }
            });
            const formData = {
              titulo: this.form.value.tituloAuditoria,
              tipo_evaluacion_id: this.form.value.tipoEvaluacion,
              cronograma_id: this.form.value.cronogramaActividades,
              //auditores: auditoresSeleccionados
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
