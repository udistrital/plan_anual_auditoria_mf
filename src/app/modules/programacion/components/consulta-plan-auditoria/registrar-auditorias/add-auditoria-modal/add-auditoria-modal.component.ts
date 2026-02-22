import { Component, OnInit, Inject } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Observable, of } from "rxjs";
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
} from "rxjs/operators";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { OikosService } from "src/app/core/services/oikos.service";
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
  macroprocesos: Parametro[] = [];
  procesos: Parametro[] = [];
  filteredDependencias!: Observable<Parametro[]>;
  isEditMode = false;
  TODOS = "Todos";

  constructor(
    private alertaService: AlertService,
    private fb: FormBuilder,
    private parametrosService: ParametrosService,
    private oikosSevice: OikosService,
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
      macroproceso: [
        this.data.auditoria?.macroprocesoId || [],
        Validators.required,
      ],
      proceso: [
        this.data.auditoria?.procesoId || [],
        Validators.required,
      ],
      dependencia: [
        this.data.auditoria?.dependenciaId || [],
        Validators.required,
      ],
      cronogramaActividades: [
        this.data.auditoria?.cronogramaId || [],
        Validators.required,
      ],
    });

    console.debug("Datos recibidos para edición:", this.data.auditoria);
    console.debug("Valor inicial del formulario:", this.auditoriaForm.value);

    this.cargarTiposEvaluacion();
    this.cargarMacroprocesos();
    this.cargarProcesos();
    this.inicializarBusquedaDependencias();
    this.cargarDependenciaInicial();
    this.cargarMeses();

    // When the macroproceso changes, clear the proceso selection and reload procesos.
    this.auditoriaForm.get("macroproceso").valueChanges.subscribe((valor: number) => {
      this.auditoriaForm.patchValue({ proceso: [] });
      this.procesos = [];
      this.cargarProcesos();
    });
  }

  cargarMeses(callback?: () => void) {
    const meses_id = environment.MESES.TIPO_PARAMETRO_ID;
    this.parametrosService
      .get(`parametro?query=TipoParametroId:${meses_id}&limit=0`)
      .subscribe((res) => {
        if (res && res.Data) {
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
        if (res && res.Data) {
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
        if (res && res.Data) {
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
    const macroprocesoId = this.auditoriaForm.get("macroproceso").value;
    if ((macroprocesoId == false || macroprocesoId == null) && macroprocesoId !== 0)
      return;

    const procesos_id = environment.INFO_AUDITORIA.TIPOS_PROCESO.VALORES.PROCESO.TIPO_PARAMETRO_ID;
    this.parametrosService
      .get(`parametro?query=TipoParametroId:${procesos_id},ParametroPadreId:${macroprocesoId}&limit=0`)
      .subscribe((res) => {
        if (res && res.Data) {
          this.procesos = res.Data;
          if (callback) callback();
        }
      });
  }

  /**
   * Initialize the search for dependencias by setting up a valueChanges subscription
   * on the dependencia form control. This will trigger a search for dependencias
   * based on the user's input, with debouncing and distinct value checks to optimize
   * API calls.
   */
  inicializarBusquedaDependencias(): void {
    const dependenciaControl = this.auditoriaForm.get("dependencia");
    this.filteredDependencias = dependenciaControl.valueChanges.pipe(
      startWith(dependenciaControl.value || ""),
      map((value: string | Parametro) =>
        typeof value === "string" ? value : value?.Nombre || ""
      ),
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((value: string) => this.buscarDependencias(value))
    );
  }

  /**
   * Load the initial dependencia for the auditoria being edited. If the form is in
   * edit mode and a dependenciaId is present, it will fetch the dependencia details
   * from the Oikos API and set the form control value accordingly.
   */
  cargarDependenciaInicial(): void {
    const dependenciaId = this.data.auditoria?.dependenciaId;
    if (!this.isEditMode || !dependenciaId) {
      return;
    }

    this.oikosSevice
      .get(`dependencia?query=Id:${dependenciaId}&limit=1&fields=Id,Nombre`)
      .pipe(catchError(() => of([])))
      .subscribe((res: Parametro[]) => {
        if (res && res.length) {
          this.auditoriaForm.patchValue({ dependencia: res[0] });
        }
      });
  }

  /**
   * Search for dependencias using the Oikos API based on the user's input. This function
   * is used in the autocomplete for the dependencia form control to provide suggestions
   * as the user types.
   * @param value The search string entered by the user to find matching dependencias
   * @returns An Observable that emits an array of Parametro objects representing the matching dependencias
   */
  buscarDependencias(value: string): Observable<Parametro[]> {
    const nombre = (value || "").trim();
    return this.oikosSevice
      .get(
        `dependencia?query=Activo:true,Nombre:${encodeURIComponent(
          nombre
        )}&limit=20&sortby=nombre&order=asc&fields=Id,Nombre`
      )
      .pipe(
        // Filter out dependencies with empty names
        map((res: any) => res.filter(
          (dep: Parametro) => dep.Nombre.length > 0
        )),
        catchError((error) => {
          console.error("Error al buscar dependencias", error);
          return of([])
        })
      );
  }

  /**
   * Display function for the dependencia autocomplete to show the selected dependencia's name.
   * @param dependencia The selected dependencia object from the autocomplete
   * @returns The name of the selected dependencia or an empty string if no valid selection is made
   */
  displayFnDependencia(dependencia: Parametro): string {
    return dependencia && dependencia.Nombre ? dependencia.Nombre : '';
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
            const cronogramaSeleccionado = this.auditoriaForm.value.cronogramaActividades;
            const cronogramaIds = cronogramaSeleccionado.includes(this.TODOS)
              ? this.meses.map(mes => mes.Id)
              : cronogramaSeleccionado;

            const formData = {
              plan_auditoria_id: this.data.planAuditoriaId,
              titulo: this.auditoriaForm.value.tituloActividad,
              tipo_evaluacion_id: this.auditoriaForm.value.tipoEvaluacion,
              macroproceso_id: this.auditoriaForm.value.macroproceso,
              proceso_id: this.auditoriaForm.value.proceso,
              dependencia_id: this.auditoriaForm.value.dependencia?.Id || this.auditoriaForm.value.dependencia,
              cronograma_id: cronogramaIds,
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
      console.warn("El formulario es inválido");
      this.auditoriaForm.markAllAsTouched();
    }
  }

}
