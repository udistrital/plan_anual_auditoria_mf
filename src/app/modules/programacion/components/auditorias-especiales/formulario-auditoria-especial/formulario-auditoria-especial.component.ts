import { AuditorEliminar, Auditor } from 'src/app/shared/data/models/auditoria-auditor';
import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { AutenticacionMidService } from "src/app/core/services/autenticacion-mid.service";
import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators
} from "@angular/forms";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { OikosService } from "src/app/core/services/oikos.service";
import { Parametro } from "src/app/shared/data/models/parametros/parametros";
import { Auditoria } from "src/app/shared/data/models/plan-anual-auditoria/plan-anual-auditoria";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from 'src/environments/environment';
import {
  of,
  forkJoin,
  tap,
} from 'rxjs';

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
  auditoresAsignados: Auditor[] = [];
  meses: Parametro[] = [];
  macroprocesos: Parametro[] = [];
  procesos: Parametro[] = [];
  dependencias: Parametro[] = [];
  TODOS = "Todos";
  isEditMode = false;  
  auditorEliminar: AuditorEliminar | null = null;

  constructor(
    private alertaService: AlertService,
    private fb: FormBuilder,
    private parametrosService: ParametrosService,
    private oikosService: OikosService,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    private PlanAnualAuditoriaMid: PlanAnualAuditoriaMid,
    public dialogRef: MatDialogRef<FormularioAuditoriaEspecialComponent>,
    private AutenticacionMidService: AutenticacionMidService,
    @Inject(MAT_DIALOG_DATA) public data: { auditoria?: Auditoria, usuarioRol: string, usuarioId: number }
  ) {
    this.auditoresSeleccionados = this.fb.array<FormGroup>([]);
    this.form = this.fb.group({
      tituloAuditoria: [ "", Validators.required],
      tipoEvaluacion: [[], Validators.required],
      macroproceso: [[], Validators.required],
      proceso: [[], Validators.required],
      dependencia: [[], Validators.required],
      cronogramaActividades: [[], Validators.required],
      auditoresSeleccionados: this.auditoresSeleccionados,
    });
  }

  ngOnInit(): void {
    this.isEditMode = !!this.data.auditoria;
    
    forkJoin<void[]>([
      of(this.CargarEvaluaciones()),
      of(this.cargarMacroprocesos()),
      this.cargarDependencias(),
      of(this.cargarMeses()),
      of(this.cargarAuditores())
    ]).subscribe(() => {
      this.cargarProcesos();
    })

    this.form.patchValue({
      tituloAuditoria: this.data.auditoria?.auditoria || "",
      tipoEvaluacion: this.data.auditoria?.tipoEvaluacionId || [],
      macroproceso: this.data.auditoria?.macroprocesoId || [],
      proceso: this.data.auditoria?.procesoId || [],
      dependencia: this.data.auditoria?.dependenciaId || [],
      cronogramaActividades: this.data.auditoria?.cronogramaId || [],
    });

    this.form.get("macroproceso").valueChanges.subscribe((valor: number) => {
      this.form.patchValue({ proceso: [] });
      this.procesos = [];
      this.cargarProcesos();
    });

    this.form.get("dependencia").valueChanges.subscribe((valor: number) => {
      console.log("Valor de dependencia cambiado:", valor);
    });

    console.log("Dependencia Id:", this.form.get("dependencia").value);
  }

  cargarMacroprocesos() {
    const macroprocesos_id = environment.INFO_AUDITORIA.TIPOS_PROCESO.VALORES.MACROPROCESO.TIPO_PARAMETRO_ID;
    this.parametrosService
      .get(`parametro?query=TipoParametroId:${macroprocesos_id}&limit=0`)
      .subscribe((res) => {
        if (res && res.Data) {
          this.macroprocesos = res.Data;
        }
      });
  }

  cargarProcesos() {
    const macroprocesoId = this.form.get("macroproceso").value;
    if ((macroprocesoId == false || macroprocesoId == null) && macroprocesoId !== 0)
      return;

    const procesos_id = environment.INFO_AUDITORIA.TIPOS_PROCESO.VALORES.PROCESO.TIPO_PARAMETRO_ID;
    this.parametrosService
      .get(`parametro?query=TipoParametroId:${procesos_id},ParametroPadreId:${macroprocesoId}&limit=0`)
      .subscribe((res) => {
        if (res && res.Data) {
          this.procesos = res.Data;
        }
      });
  }

  cargarDependencias() {
    return this.oikosService
      .get("dependencia?query=activo:true&limit=0")
      .pipe(
        tap((res) => {
          if (res) {
            this.dependencias = res;
          }
        })
      );
  }

  inicializarAuditoresSeleccionados(): void {
    this.PlanAnualAuditoriaMid.get(
      `auditor?query=auditoria_id:${this.data.auditoria?.id},activo:true`
    ).subscribe({
      next: (res) => {
        this.auditoresSeleccionados.clear();
        this.auditoresAsignados = res.Data || [];

        this.auditoresAsignados.forEach((auditorAsignado) => {
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
          const auditorEncontrado = this.auditoresAsignados.find((a) => a.auditor_id === auditorSeleccionado.auditor.id);

          if (auditorEncontrado) {
            this.auditorEliminar = {
              id: auditorEncontrado._id,
              activo: false,
              id_tercero: auditorEncontrado.auditor_id!,
              auditoria_id: auditorEncontrado._id
            };

            this.planAnualAuditoriaService
              .delete("auditor", this.auditorEliminar)
              .subscribe({
                next: (deleteResponse: any) => {
                  this.auditoresSeleccionados.removeAt(index);
                  this.auditoresAsignados = this.auditoresAsignados.filter(a => a.auditor_id !== auditorSeleccionado.auditor.id);
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
        }
      });
  }

  cargarMeses() {
    const meses_id = environment.MESES.TIPO_PARAMETRO_ID;
    this.parametrosService
      .get(`parametro?query=TipoParametroId:${meses_id}&limit=0`)
      .subscribe((res) => {
        if (res !== null) {
          this.meses = res.Data;
        }
      });
  }

  CargarEvaluaciones() {
    const eval_id = environment.TIPO_EVALUACION.TIPO_PARAMETRO_ID;
    this.parametrosService
      .get(`parametro?query=TipoParametroId:${eval_id}&limit=0`)
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
      if (res && res.Data) {
        const auditorMap =new Map();
        res.Data.filter(
          (auditor: any) =>
            auditor.finalizado === false &&
            ["AUDITOR", "AUDITOR EXPERTO", "AUDITOR ASISTENTE"].includes(auditor.rol_usuario)
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

  cambiarEstado(estado: number) {
    const estadoPayload = {
      auditoria_id: this.data.auditoria?.id,
      estado_id: estado,
      fase_id: environment.AUDITORIA_FASE.PROGRAMACION,
      usuario_id: this.data.usuarioId,
      usuario_rol: this.data.usuarioRol
    }
    return this.planAnualAuditoriaService.post("auditoria-estado", estadoPayload)
  }

  asignarAuditor(auditorSeleccionado: any): void {
    const auditorPayload = {
      auditoria_id: this.data.auditoria?.id,
      auditor_id: auditorSeleccionado.id,
      asignado: true,
      asignado_por_id: this.data.usuarioId,
      auditor_lider: auditorSeleccionado.lider,
    };

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
              tipo_evaluacion_id: this.form.value.tipoEvaluacion,
              cronograma_id: this.form.value.cronogramaActividades,
              macroproceso_id: this.form.value.macroproceso,
              proceso_id: this.form.value.proceso,
              dependencia_id: this.form.value.dependencia.Id,
              //auditores: auditoresSeleccionados
            };

            this.planAnualAuditoriaService
              .put(`auditoria/${this.data.auditoria!.id}`, formData)
              .subscribe({
                next: (response: any) => {
                  if (response.Status === 200) {
                    const nuevoEstado = auditoresSeleccionados.length > 0 || this.auditoresAsignados.length > 0 ?
                      environment.AUDITORIA_ESTADO.PROGRAMACION.AUDITOR_ASIGNADO :
                      environment.AUDITORIA_ESTADO.PROGRAMACION.POR_ASIGNAR;
                    if (nuevoEstado !== this.data.auditoria?.estado_id) {
                      this.cambiarEstado(nuevoEstado)
                      .subscribe({
                        next: (resp: any) => {
                          this.alertaService.showSuccessAlert(
                            `Auditoría actualizada exitosamente.`
                          );
                          this.dialogRef.close({ saved: true });
                        }, error: (error) => {
                          this.alertaService.showErrorAlert("Error al cambiar el estado de la auditoría después de asignar auditores");
                        }
                      });
                    } else {
                      this.alertaService.showSuccessAlert(
                        `Auditoría actualizada exitosamente.`
                      );
                      this.dialogRef.close({ saved: true });
                    }
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
