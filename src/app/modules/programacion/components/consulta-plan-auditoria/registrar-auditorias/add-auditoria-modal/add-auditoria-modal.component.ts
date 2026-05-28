import { Component, OnInit, Inject } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { catchError, map, of } from "rxjs";
import { OikosService } from "src/app/core/services/oikos.service";
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
    standalone: false
})
export class AddAuditoriaModalComponent implements OnInit {
  auditoriaForm: FormGroup;
  evaluaciones: Parametro[] = [];
  meses: Parametro[] = [];
  macroprocesos: Parametro[] = [];
  procesos: Parametro[] = [];
  dependencias: Parametro[] = [];
  cantidadesAuditorias: Parametro[] = [];
  isEditMode = false;
  TODOS = "Todos";

  constructor(
    private readonly alertaService: AlertService,
    private readonly fb: FormBuilder,
    private readonly parametrosService: ParametrosService,
    private readonly oikosService: OikosService,
    private readonly planAnualAuditoriaService: PlanAnualAuditoriaService,
    public dialogRef: MatDialogRef<AddAuditoriaModalComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      usuario_id: number;
      usuario_rol: string;
      planAuditoriaId: string;
      vigenciaId: number;
      isEditExtraordinario: boolean;
      auditoria?: Auditoria
    }
  ) {
    this.auditoriaForm = this.fb.group({
      tituloActividad: [
        this.data.auditoria?.auditoria ?? '',
        Validators.required,
      ],
      tipoEvaluacion: [
        this.data.auditoria?.tipoEvaluacionId ?? [],
        Validators.required,
      ],
      macroprocesos: [
        this.data.auditoria?.macroprocesosId ?? [],
        Validators.required,
      ],
      procesos: [
        this.data.auditoria?.procesosId ?? [],
        Validators.required,
      ],
      dependencias: [
        this.data.auditoria?.dependenciasId ?? [],
        Validators.required,
      ],
      cronogramaActividades: [
        this.data.auditoria?.cronogramaId ?? [],
        Validators.required,
      ],
      cantidadAuditorias: [
        this.data.auditoria?.cantidadAuditorias ?? [],
        Validators.required,
      ]
    });
  }

  getControl(nombre: string): FormControl {
    return this.auditoriaForm.get(nombre) as FormControl;
  }

  ngOnInit(): void {
    this.isEditMode = !!this.data.auditoria;

    console.debug("Datos recibidos para edición:", this.data.auditoria);
    console.debug("Valor inicial del formulario:", this.auditoriaForm.value);

    this.cargarTiposEvaluacion();
    this.cargarMacroprocesos();
    this.cargarProcesos();
    this.cargarDependencias();
    this.cargarMeses();
    this.inicializarCantidadAuditorias();

    // When the macroproceso changes, clear the proceso selection and reload procesos.
    this.auditoriaForm.get("macroprocesos")?.valueChanges.subscribe(() => {
      this.cargarProcesos(this.actualizarProcesosSeleccionados.bind(this));
    });
  }

  actualizarProcesosSeleccionados(): void {
    const procesosActuales = this.auditoriaForm.get("procesos")?.value ?? [];
    const procesosFiltrados = procesosActuales.filter((procesoId: number) =>
      this.procesos.some((proceso) => proceso.Id === procesoId)
    );

    console.debug("Procesos antes de actualizar:", procesosActuales);
    console.debug("Procesos después de actualizar:", procesosFiltrados);

    this.auditoriaForm.patchValue({ procesos: procesosFiltrados });
  }

  inicializarCantidadAuditorias(): void {
    const minCantidad = 1;
    const maxCantidad = 12;
    this.cantidadesAuditorias = Array.from(
      { length: maxCantidad - minCantidad + 1 },
      (_, i) => ({
        Id: i + minCantidad,
        Nombre: (i + minCantidad).toString()
      })
    );
  }

  cargarMeses(callback?: () => void) {
    const meses_id = environment.MESES.TIPO_PARAMETRO_ID;
    this.parametrosService
      .get(`parametro?query=TipoParametroId:${meses_id}&limit=0`)
      .subscribe((res) => {
        if (res?.Data) {
          this.meses = res.Data;
          if (callback) callback();
        }
      });
  }

  /**
   * Load evaluation types from the Parametros API and execute a callback function.
   * @param callback Optional callback function to execute after loading evaluation types
   */
  cargarTiposEvaluacion(callback?: () => void) {
    const tipo_evaluacion_id = environment.TIPO_EVALUACION.TIPO_PARAMETRO_ID;
    this.parametrosService
      .get(`parametro?query=TipoParametroId:${tipo_evaluacion_id}&limit=0`)
      .subscribe((res) => {
        if (res?.Data) {
          this.evaluaciones = res.Data;
          if (callback) callback();
        }
      });
  }

  /**
   * Load macroprocesos from the Parametros API and execute a callback function
   * once the data is loaded.
   * @param callback Optional callback function to execute after loading macroprocesos
   */
  cargarMacroprocesos(callback?: () => void) {
    const macroprocesos_id = environment.INFO_AUDITORIA.TIPOS_PROCESO.VALORES.MACROPROCESO.TIPO_PARAMETRO_ID;
    this.parametrosService
      .get(`parametro?query=TipoParametroId:${macroprocesos_id}&limit=0`)
      .subscribe((res) => {
        if (res?.Data) {
          this.macroprocesos = res.Data;
          if (callback) callback();
        }
      });
  }

  /**
   * Load procesos from the Parametros API based on the selected macroproceso and
   * execute a callback function once the data is loaded.
   * @param callback Optional callback function to execute after loading procesos
   */
  cargarProcesos(callback?: () => void) {
    const macroprocesosId = this.auditoriaForm.get("macroprocesos")?.value;
    const macroprocesosIdBarSeparated = Array.isArray(macroprocesosId) ? macroprocesosId.join("|") : macroprocesosId;
    const procesos_id = environment.INFO_AUDITORIA.TIPOS_PROCESO.VALORES.PROCESO.TIPO_PARAMETRO_ID;
    this.parametrosService
      .get(`parametro?query=TipoParametroId:${procesos_id},ParametroPadreId__in:${macroprocesosIdBarSeparated}&limit=0`)
      .pipe(
        map((res: any) => res?.Data),
        catchError(() => of([])),
      )
      .subscribe((data: Parametro[]) => {
        this.procesos = data;
        if (callback) callback();
      });
  }

  cargarDependencias(callback?: () => void) {
    this.oikosService
      .get("dependencia?query=activo:true&limit=0")
      .subscribe((res) => {
        if (res) {
          this.dependencias = res;
          if (callback) callback();
        }
      });
  }

  asignarTodos(): void {
    const seleccion = [this.TODOS];
    this.auditoriaForm.get("cronogramaActividades")?.setValue(seleccion);
  }

  cambioMes(): void {
    const seleccionados = this.auditoriaForm.get("cronogramaActividades")?.value;

    if (seleccionados.includes(this.TODOS) && seleccionados.length > 1) {
      this.auditoriaForm
        .get("cronogramaActividades")?.setValue(seleccionados.filter((mes: string) => mes !== this.TODOS));
    }

    if (seleccionados.length === 0) {
      this.auditoriaForm.get("cronogramaActividades")?.setValue([this.TODOS]);
    }
  }

  guardarAuditoria(): void {
    if (this.auditoriaForm.valid) {
      this.alertaService
        .showConfirmAlert(
          `¿Está seguro(a) de ${
            this.isEditMode ? "actualizar" : "guardar"
          } la auditoría? ${
            this.data.isEditExtraordinario ? "\nEsta auditoría se encuentra en el estado " + this.data.auditoria?.estado : ""
          }`
        )
        .then((result) => {
          if (result.isConfirmed) {
            const cronogramaSeleccionado = this.auditoriaForm.value.cronogramaActividades;
            const cronogramaIds = cronogramaSeleccionado.includes(this.TODOS)
              ? this.meses.map(mes => mes.Id)
              : cronogramaSeleccionado;

            const formData = {
              plan_auditoria_id: this.data.planAuditoriaId,
              titulo: this.auditoriaForm.value.tituloActividad,
              tipo_evaluacion_id: this.auditoriaForm.value.tipoEvaluacion,
              macroproceso_id: this.auditoriaForm.value.macroprocesos,
              proceso_id: this.auditoriaForm.value.procesos,
              dependencia_id: this.auditoriaForm.value.dependencias,
              cantidad_auditorias: this.auditoriaForm.value.cantidadAuditorias,
              cronograma_id: cronogramaIds,
              vigencia_id: this.data.vigenciaId
            };

            const estadoInicial = {
              usuario_id: this.data.usuario_id,
              usuario_rol: this.data.usuario_rol,
              fase_id: environment.AUDITORIA_FASE.PROGRAMACION,
              // estado_id: environment.AUDITORIA_ESTADO.PROGRAMACION.BORRADOR_ID,
              estado_id: environment.AUDITORIA_PADRE_ESTADO.BORRADOR_ID,
            };

            const request$ = this.isEditMode
              ? this.planAnualAuditoriaService.put(
                  `auditoria-padre/${this.data.auditoria!.id}`,
                  formData
                )
              : this.planAnualAuditoriaService.post("auditoria-gestion", {...formData, ...estadoInicial});

            request$.subscribe({
              next: (response) => {
                if (this.isEditMode && this.data.isEditExtraordinario) {
                  this.actualizarEstadoAuditoriaPadre();
                } else {
                  this.mostrarMensajeExito();
                }
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
      console.warn("El formulario es inválido");
      this.auditoriaForm.markAllAsTouched();
    }
  }

  actualizarEstadoAuditoriaPadre(): void {
    this.planAnualAuditoriaService.post(
      'auditoria-padre-estado',
      {
        auditoria_padre_id: this.data.auditoria!.id,
        usuario_id: this.data.usuario_id,
        usuario_rol: this.data.usuario_rol,
        fase_id: environment.AUDITORIA_FASE.PROGRAMACION,
        estado_id: environment.AUDITORIA_PADRE_ESTADO.CON_MODIFICACION_EXTEMPORANEA_ID,
      }
    ).subscribe({
      next: (nuevoEstado: any) => this.mostrarMensajeExito(nuevoEstado?.Data?._id),
      error: (err) => {
        console.error('Error actualizando estado de auditoría padre', err);
        this.mostrarMensajeExito();
      }
    });
  }

  mostrarMensajeExito(nuevoEstado?: string): void {
    this.alertaService.showSuccessAlert(
      `Auditoría ${
        this.isEditMode ? "actualizada" : "guardada"
      } exitosamente.`
    );
    this.dialogRef.close({
      saved: true,
      cantidad: this.auditoriaForm.value.cantidadAuditorias,
      nuevoEstado,
    });
  }

}
