import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { AutenticacionMidService } from "./../../../../../core/services/autenticacion-mid.service";
import { Component, Inject, OnInit } from "@angular/core";
import { FormArray, FormBuilder, FormGroup } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { UserService } from "src/app/core/services/user.service";
import { AuditorEliminar, Auditoria } from "src/app/shared/data/models/auditoria-auditor";
import { Parametro } from "src/app/shared/data/models/parametros/parametros";
import { AlertService } from "src/app/shared/services/alert.service";

interface Auditor {
  nombre: string;
  documento: number;
  id: number;
}

@Component({
  selector: "app-modal-agregar-auditor",
  templateUrl: "./modal-agregar-auditor.component.html",
  styleUrl: "./modal-agregar-auditor.component.css",
})
export class ModalAgregarAuditorComponent implements OnInit {
  form: FormGroup | any;
  evaluaciones: Parametro[] = [];
  tipoEvaluacion: number[] = [];
  auditores: Auditor[] = [];
  auditoresSeleccionados: FormArray<FormGroup>;
  meses: Parametro[] = [];
  TODOS = "Todos";
  isEditMode = false;
  usuarioId: any;
  auditorEliminar: AuditorEliminar[] = [];

  constructor(
    private alertaService: AlertService,
    private fb: FormBuilder,
    private PlanAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    public dialogRef: MatDialogRef<ModalAgregarAuditorComponent>,
    private AutenticacionMidService: AutenticacionMidService,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: { auditoria?: Auditoria }
  ) {
    this.auditoresSeleccionados = this.fb.array<FormGroup>([]);
  }

  ngOnInit(): void {
    this.isEditMode = !!this.data.auditoria;
    this.cargarAuditores();

    this.userService.getPersonaId().then((usuarioId) => {
      this.usuarioId = usuarioId;
    });
    this.form = this.fb.group({
      tituloAuditoria: [this.data.auditoria?.titulo || ""],
      tipoEvaluacion: [this.data.auditoria?.tipo_evaluacion_nombre || []],
      cronogramaActividades: [this.data.auditoria?.cronograma_nombre || []],
      auditoresSeleccionados: this.auditoresSeleccionados,
      auditor: [""],
    });
  }

  inicializarAuditoresSeleccionados(): void {
    this.PlanAnualAuditoriaMid.get(
      `auditor?query=auditoria_id:${this.data.auditoria?._id},activo:true`
    ).subscribe({
      next: (res) => {
        this.auditoresSeleccionados.clear();
        const auditoresAsignados: any[] = res.Data || [];

        auditoresAsignados.forEach((auditorAsignado) => {
          const auditorEncontrado = this.auditores.find(
            (a) => a.id === auditorAsignado.auditor_id
          );

          if (auditorEncontrado) {
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
      error: (error) => {
        console.error("Error al cargar auditores asignados:", error);
      }
    });
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
    
    this.alertaService
      .showConfirmAlert(`¿Está seguro de eliminar este auditor?`)
      .then((result) => {
        if (result.isConfirmed) {
          this.PlanAnualAuditoriaMid.get(
            `auditor?query=auditoria_id:${this.data.auditoria?._id},activo:true,auditor_id:${auditorSeleccionado.auditor.id}`
          ).subscribe((res) => {
            this.auditorEliminar = res.Data.map((item: any) => ({
              id: item._id,
              activo: item.activo,
              id_tercero: item.auditor_id,
              auditoria_id: item.auditoria_id
            }));
            
            if (this.auditorEliminar.length > 0) {
              const idAuditor = this.auditorEliminar[0];
              this.planAnualAuditoriaService
                .delete("auditor", idAuditor)
                .subscribe({
                  next: (deleteResponse: any) => {
                    this.auditoresSeleccionados.removeAt(index);
                    this.alertaService.showSuccessAlert(
                      "Auditor eliminado correctamente."
                    );
                  },
                  error: (err) => {
                    this.alertaService.showErrorAlert(
                      "Error al eliminar el auditor. Inténtelo de nuevo."
                    );
                  },
                });
            } else {
              this.auditoresSeleccionados.removeAt(index);
              this.alertaService.showSuccessAlert(
                "Auditor eliminado correctamente."
              );
            }
          });
        }
      });
  }

  cargarAuditores() {
    this.AutenticacionMidService.get("rol/periods").subscribe((res) => {
      if (res && res.Data) {
        const auditorMap =new Map();

        res.Data.filter(
          (auditor: any) =>
            auditor.finalizado === false &&
            ["AUDITOR", "AUDITOR EXPERTO"].includes(auditor.rol_usuario)
        ).forEach((auditor: any) => {
          auditorMap.set(auditor.id_tercero, {
          nombre: auditor.nombre,
          documento: auditor.documento,
          id: auditor.id_tercero,
        });
      });

        this.auditores = Array.from(auditorMap.values());
      }
      this.inicializarAuditoresSeleccionados();
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
      auditoria_id: this.data.auditoria?._id,
      auditor_id: auditorSeleccionado.id,
      asignado: true,
      asignado_por_id: this.usuarioId,
      auditor_lider: auditorSeleccionado.lider,
    };

    this.PlanAnualAuditoriaMid.get(
      `auditor?query=auditoria_id:${this.data.auditoria?._id},activo:true,auditor_id:${auditorPayload.auditor_id}`
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

            const auditoresSeleccionados =
              this.auditoresSeleccionados.value.map(
                (item: { auditor: Auditor | null; lider: boolean }) => ({
                  documento: item.auditor?.documento || 0,
                  lider: item.lider,
                  id: item.auditor?.id,
                })
              );

            auditoresSeleccionados.forEach((auditor) => {
              if (auditor.documento) {
                this.asignarAuditor(auditor);
              }
            });
            const formData = {
              titulo: this.form.value.tituloAuditoria,
              tipo_evaluacion_id: this.data.auditoria?.tipo_evaluacion_id,
              cronograma_id: this.data.auditoria?.cronograma_id,
              //auditores: auditoresSeleccionados
            };

            this.planAnualAuditoriaService
              .put(`auditoria/${this.data.auditoria!._id}`, formData)
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
      this.form.markAllAsTouched();
    }
  }
}
