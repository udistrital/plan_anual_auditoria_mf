import { PlanAnualAuditoriaMid } from "src/app/core/services/plan-anual-auditoria-mid.service";
import { AutenticacionMidService } from "src/app/core/services/autenticacion-mid.service";
import { Component, Inject, OnInit } from "@angular/core";
import { Subscription } from 'rxjs';
import { FormArray, FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { PlanAnualAuditoriaService } from "src/app/core/services/plan-anual-auditoria.service";
import { UserService } from "src/app/core/services/user.service";
import { AuditorEliminar, Auditoria, Auditor, AuditorDesasignar } from "src/app/shared/data/models/auditoria-auditor";
import { Parametro } from "src/app/shared/data/models/parametros/parametros";
import { AlertService } from "src/app/shared/services/alert.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-modal-agregar-auditor",
  templateUrl: "./modal-agregar-auditor.component.html",
  styleUrl: "./modal-agregar-auditor.component.css",
})
export class ModalAgregarAuditorComponent implements OnInit {
  form: FormGroup<any> = null as any;
  evaluaciones: Parametro[] = [];
  tipoEvaluacion: number[] = [];
  auditores: Auditor[] = [];
  auditoresSeleccionados: FormArray<FormGroup>;
  auditoresAsignados: Auditor[] = [];
  auditoresNoAsignados: Auditor[] = [];
  auditoresDisponiblesCache: Auditor[][] = [];
  private selectionChangesSub: Subscription | null = null;
  meses: Parametro[] = [];
  TODOS = "Todos";
  isEditMode = false;
  usuarioId: any;
  auditorEliminar: AuditorEliminar | null = null;
  auditorDesasignar: AuditorDesasignar | null = null;

  constructor(
    private readonly alertaService: AlertService,
    private readonly fb: FormBuilder,
    private readonly PlanAnualAuditoriaMid: PlanAnualAuditoriaMid,
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService,
    public readonly dialogRef: MatDialogRef<ModalAgregarAuditorComponent>,
    private readonly AutenticacionMidService: AutenticacionMidService,
    private readonly userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: { auditoria?: Auditoria, usuarioRol: string }
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
      tituloAuditoria: [this.data.auditoria?.titulo ?? ''],
      subtituloAuditoria: [this.data.auditoria?.subtitulo ?? ''],
      tipoEvaluacion: [this.data.auditoria?.tipo_evaluacion_nombre ?? []],
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
        const auditoresRelacionados = res.Data ?? [];
  
        // Separar auditores asignados y no asignados
        this.auditoresAsignados = auditoresRelacionados.filter(
          (auditor: { asignado: boolean; }) => auditor.asignado === true
        );
        this.auditoresNoAsignados = auditoresRelacionados
        .filter((auditor: { asignado: boolean }) => auditor.asignado === false)
        .map((auditor: any) => ({
          id: auditor.auditor_id,
          nombre: auditor.auditor_nombre,
          documento: auditor.auditor_documento, 
          auditor_id: auditor.auditor_id, 
        }));
  
        // Procesar auditores asignados
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
        console.error("Error al cargar auditores relacionados:", error);
      }
    });
  
    // Inicializar caché y suscripciones tras poblar los controles
    this.recomputeAuditoresDisponibles();
    this.subscribeToSelectionChanges();
  }

  agregarAuditor() {
    this.auditoresSeleccionados.push(
      this.fb.group({
        auditor: this.fb.control<Auditor | null>(null),
        lider: this.fb.control<boolean>(false),
      })
    );
    this.recomputeAuditoresDisponibles();
  }

  eliminarAuditor(index: number) {
    const auditorSeleccionado = this.auditoresSeleccionados.at(index)?.value;
    const estadoActual = this.data.auditoria?.estado_id ?? 0; // Provide a default value
    const error = this.validarEliminacion(auditorSeleccionado, estadoActual);
  
    if (error) {
      this.alertaService.showAlert("",error);
      return;
    }
  
    this.confirmarEliminacion(index, auditorSeleccionado);
  }

  private validarEliminacion(auditor: any, estado: number): string | null {
  
    const estados = environment.AUDITORIA_ESTADO.PROGRAMACION;
  
    // Validaciones cuando hay auditores asignados
    if (estado >= estados.AUDITOR_ASIGNADO && this.auditoresAsignados?.length) {
  
      const esUnicoAsignado =
        this.auditoresAsignados.length === 1 &&
        this.auditoresAsignados[0].auditor_id === auditor.auditor.id;
  
      if (esUnicoAsignado) {
        return "No se puede eliminar el último auditor asignado. Debe guardar mas auditores antes de eliminar este";
      }
  
      if (this.auditoresSeleccionados.length <= 1) {
        return "Debe haber al menos un auditor seleccionado.";
      }
    }
  
    return null;
  }

  confirmarEliminacion(index: number, auditorSeleccionado: any) {
    this.alertaService
      .showConfirmAlert(`¿Está seguro de eliminar este auditor?`)
      .then((result) => {
        if (result.isConfirmed) {
          const auditorEncontrado = this.auditoresAsignados?.find(
            (a) => a.auditor_id === auditorSeleccionado.auditor.id
          );

          if (auditorEncontrado) {
            this.auditorEliminar = {
              id: auditorEncontrado._id,
              auditoria_id: auditorEncontrado._id,
              id_tercero: auditorEncontrado.auditor_id!,
              activo: false,
            };
            this.planAnualAuditoriaService
              .delete("auditor", this.auditorEliminar)
              .subscribe({
                next: () => {
                  this.auditoresSeleccionados.removeAt(index);
                  this.auditoresAsignados = this.auditoresAsignados.filter(
                    (a) => a.auditor_id !== auditorSeleccionado.auditor.id
                  );
                  this.alertaService.showSuccessAlert(
                    "Auditor eliminado correctamente."
                  );
                  this.recomputeAuditoresDisponibles();
                },
                error: () => {
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
            this.recomputeAuditoresDisponibles();
          }
        }
      });
  }

  cargarAuditores() {
    this.AutenticacionMidService.get("rol/periods").subscribe((res) => {
      if (res?.Data) {
        const auditorMap = new Map();

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

        this.auditores = Array.from(auditorMap.values())
            .sort((a: Auditor, b: Auditor): number =>
              a.nombre.localeCompare(b.nombre)
            );
      }
      this.inicializarAuditoresSeleccionados();
    });
  }

  auditoresDisponibles(index: number): Auditor[] {
    return this.auditoresDisponiblesCache[index] ?? this.auditores;
  }

  private subscribeToSelectionChanges(): void {
    if (this.selectionChangesSub) {
      this.selectionChangesSub.unsubscribe();
    }
    if (this.auditoresSeleccionados) {
      this.selectionChangesSub = this.auditoresSeleccionados.valueChanges.subscribe(() => {
        this.recomputeAuditoresDisponibles();
      });
    }
  }

  private recomputeAuditoresDisponibles(): void {
    if (!this.auditores || !this.auditoresSeleccionados) {
      return;
    }
  
    const controls = this.auditoresSeleccionados.controls ?? [];
    const newCache: Auditor[][] = [];
  
    // IDs de auditores NO asignados
    const noAsignadosIds = this.auditoresNoAsignados.map(a => a.id);
  
    for (let i = 0; i < controls.length; i++) {
      const seleccionados = controls
        .filter((_, idx) => idx !== i)
        .map((control) => control.get('auditor')?.value?.id)
        .filter((id: any) => id != null);
  
      newCache[i] = this.auditores.filter((auditor) => {
        const yaSeleccionado = seleccionados.includes(auditor.id);
        const esNoAsignado = noAsignadosIds.includes(auditor.id);
  
        return !yaSeleccionado && !esNoAsignado;
      });
    }
  
    // mantener referencias estables
    const maxLen = Math.max(this.auditoresDisponiblesCache.length, newCache.length);
    for (let i = 0; i < maxLen; i++) {
      const oldArr = this.auditoresDisponiblesCache[i] ?? [];
      const newArr = newCache[i] ?? [];
      if (!this.areAuditorArraysEqual(oldArr, newArr)) {
        this.auditoresDisponiblesCache[i] = newArr;
      }
    }
  
    if (newCache.length < this.auditoresDisponiblesCache.length) {
      this.auditoresDisponiblesCache.length = newCache.length;
    }
  }

  private areAuditorArraysEqual(a: Auditor[], b: Auditor[]): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].id !== b[i].id) return false;
    }
    return true;
  }

  ngOnDestroy(): void {
    if (this.selectionChangesSub) {
      this.selectionChangesSub.unsubscribe();
      this.selectionChangesSub = null;
    }
  }

  onLiderChange(selectedIndex: number): void {
    this.auditoresSeleccionados.controls.forEach((control, index) => {
      if (index !== selectedIndex) {
        control.get("lider")?.setValue(false);
      }
    });
  }

  getAuditorControl(index: number): FormControl<Auditor | null> {
    return this.auditoresSeleccionados.at(index).get("auditor") as FormControl<Auditor | null>;
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
      const auditorAsignado = res.Data[0] ?? null;
  
      const request$ = auditorAsignado
        ? this.planAnualAuditoriaService.put(`auditor/${auditorAsignado._id}`, auditorPayload)
        : this.planAnualAuditoriaService.post("auditor", auditorPayload);
  
      request$.subscribe({
        next: () => {
          // 1. Agregar al FormArray
          const auditorEncontrado = this.auditores.find(
            (a) => a.id === auditorSeleccionado.id
          );
  
          if (auditorEncontrado) {
            this.auditoresSeleccionados.push(
              this.fb.group({
                auditor: this.fb.control<Auditor | null>(auditorEncontrado),
                lider: this.fb.control<boolean>(false),
              })
            );
          }
  
          // 2. Mover de "No Asignados" → "Asignados"
          this.auditoresNoAsignados = this.auditoresNoAsignados.filter(
            (a) => a.id !== auditorSeleccionado.id
          );
  
          this.auditoresAsignados.push({
            ...auditorSeleccionado,
            auditor_id: auditorSeleccionado.id,
            asignado: true,
          });
  
          // 3. Recalcular disponibles
          this.recomputeAuditoresDisponibles();
  
          // 4. Feedback UX
          this.alertaService.showSuccessAlert("Auditor asignado correctamente.");
        },
        error: (err) => {
          console.error("Error al asignar auditor", err);
          this.alertaService.showErrorAlert(
            "Error al asignar el auditor. Inténtelo de nuevo."
          );
        },
      });
    });
  }

  cambiarEstado(estado: number) {
    const estadoPayload = {
      auditoria_id: this.data.auditoria?._id,
      estado_id: estado,
      fase_id: environment.AUDITORIA_FASE.PROGRAMACION,
      usuario_id: this.usuarioId,
      usuario_rol: this.data.usuarioRol
    }
    return this.planAnualAuditoriaService.post("auditoria-estado", estadoPayload)
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
                  documento: item.auditor?.documento ?? 0,
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
              subtitulo: this.form.value.subtituloAuditoria,
              tipo_evaluacion_id: this.data.auditoria?.tipo_evaluacion_id,
              //auditores: auditoresSeleccionados
            };

            this.planAnualAuditoriaService
              .put(`auditoria/${this.data.auditoria!._id}`, formData)
              .subscribe({
                next: (response: any) => {
                  if (response.Status === 200) {
                    const estadoActual = this.data.auditoria?.estado_id;
                    const nuevoEstado = auditoresSeleccionados.length > 0 || this.auditoresAsignados.length > 0 ?
                      environment.AUDITORIA_ESTADO.PROGRAMACION.AUDITOR_ASIGNADO :
                      environment.AUDITORIA_ESTADO.PROGRAMACION.POR_ASIGNAR;

                    // Validar si el estado actual permite el cambio
                    if (estadoActual === environment.AUDITORIA_ESTADO.PROGRAMACION.POR_ASIGNAR && nuevoEstado === environment.AUDITORIA_ESTADO.PROGRAMACION.AUDITOR_ASIGNADO) {
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
                    this.alertaService.showErrorAlert(
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

  desasignarAuditor(index: number) {
    const auditorSeleccionado = this.auditoresSeleccionados.at(index)?.value;
  
    if (this.auditoresAsignados.length > 1) {
      this.alertaService
        .showConfirmAlert(`¿Está seguro de desasignar este auditor?`)
        .then((result) => {
          if (result.isConfirmed) {
  
            const auditorEncontrado = this.auditoresAsignados.find(
              (a) => a.auditor_id === auditorSeleccionado.auditor.id
            );
  
            const actualizarUI = () => {
              // 1. Remover del FormArray
              this.auditoresSeleccionados.removeAt(index);
  
              // 2. Remover de asignados
              this.auditoresAsignados = this.auditoresAsignados.filter(
                (a) => a.auditor_id !== auditorSeleccionado.auditor.id
              );
  
              // 3. Devolver a NO asignados (normalizado)
              this.auditoresNoAsignados.push({
                id: auditorSeleccionado.auditor.id,
                nombre: auditorSeleccionado.auditor.nombre,
                documento: auditorSeleccionado.auditor.documento,
                auditor_id: auditorSeleccionado.auditor.id,
                _id: ""
              });
  
              // 4. Recalcular disponibles
              this.recomputeAuditoresDisponibles();

              this.dialogRef.close({ saved: true });
  
              // 5. Feedback
              this.alertaService.showSuccessAlert(
                "Auditor desasignado correctamente."
              );
              
            };
  
            if (auditorEncontrado) {
              this.auditorDesasignar = {
                asignado: false,
              };
  
              this.planAnualAuditoriaService
                .put("auditor/" + auditorEncontrado._id, this.auditorDesasignar)
                .subscribe({
                  next: () => {
                    actualizarUI();
                  },
                  error: () => {
                    this.alertaService.showErrorAlert(
                      "Error al desasignar el auditor. Inténtelo de nuevo."
                    );
                  },
                });
            } else {
              // Caso local (no persistido aún)
              actualizarUI();
            }
          }
        });
    } else {
      this.alertaService.showErrorAlert(
        "No se puede desasignar el auditor. Debe haber al menos un auditor asignado a la auditoría."
      );
    }
  }
}
