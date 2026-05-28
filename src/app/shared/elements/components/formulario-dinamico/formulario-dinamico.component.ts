import { Component, Input, OnDestroy, OnInit, Output, EventEmitter } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Subscription } from "rxjs";
import { ParametrosService } from "src/app/core/services/parametros.service";
import { Formulario } from "src/app/shared/data/models/formulario.model";

@Component({
    selector: "app-formulario-dinamico",
    templateUrl: "./formulario-dinamico.component.html",
    styleUrls: ["./formulario-dinamico.component.css"],
    standalone: false
})
export class FormularioDinamicoComponent implements OnInit, OnDestroy {
  @Input() formulario: Formulario = { campos: [] };
  // @Input() modo: 'crear' | 'editar' = 'crear';
  @Output() submitFormulario = new EventEmitter<any>();
  @Output() campoSeleccionado = new EventEmitter<{ campo: any; valor: any }>();
  form: FormGroup = this.fb.group({});
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly fb: FormBuilder,
    private readonly parametrosService: ParametrosService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({});

    if (this.formulario?.campos) {
      this.formulario.campos.forEach((campo) => {
        const validators = this.getValidators(campo.validaciones);

        if (campo.nombre) {
          this.form.addControl(
            campo.nombre,
            this.fb.control(
              { value: campo.valor ?? '', disabled: campo.deshabilitado },
              validators
            )
          );
        }
        // Verificar si el campo tiene un URL para opciones dinámicas
        if (campo.parametros?.urlParametros) {
          this.parametrosService
            .get(campo.parametros?.urlParametros)
            .subscribe((options: any) => {
              campo.parametros!.opciones = options.Data;
            });
        }
      });

      this.inicializarDependenciasDeFecha();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getValidators(validaciones: any[]): any[] {
    const validators: any[] = [];
    if (validaciones) {
      validaciones.forEach((validacion: any) => {
        if (validacion) {
          if (validacion.tipo == "requerido") {
            validators.push(Validators.required);
          }
          if (validacion.tipo == "minLength") {
            validators.push(Validators.minLength(validacion.valor));
          }
          if (validacion.tipo == "maxLength") {
            validators.push(Validators.maxLength(validacion.valor));
          }
          if (validacion.tipo == "patron") {
            validators.push(Validators.pattern(validacion.valor));
          }
          if (validacion.tipo == "min") {
            console.log(validacion.valor, validacion.tipo);
            validators.push(Validators.min(validacion.valor));
          }
          if (validacion.tipo == "max") {
            validators.push(Validators.max(validacion.valor));
          }
          if (validacion.tipo == "email") {
            validators.push(Validators.email);
          }
        }
      });
    }

    return validators;
  }

  getValidacionValor(
    campo: any,
    tipoValidacion: string
  ): number | string | null {
    const validacion = campo.validaciones?.find(
      (v: any) => v.tipo.toLowerCase() === tipoValidacion.toLowerCase()
    );
    return validacion ? validacion.valor : null;
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formData = this.form.value;
      this.submitFormulario.emit(formData);
    } else {
      this.form.markAllAsTouched();
      this.submitFormulario.emit(null);
    }
  }

  onSelectionChange(event: any, campo: any): void {
    const valorSeleccionado = event.value;
    this.campoSeleccionado.emit({ campo, valor: valorSeleccionado });
  }

  getFechaMinima(campo: any): Date | null {
    const fechaMinimaDependiente = campo.parametros?.fecha_minima_dependiente;

    if (fechaMinimaDependiente) {
      const valorDependiente = this.form.get(fechaMinimaDependiente)?.value;
      const fechaDependiente = this.parsearFecha(valorDependiente);

      if (fechaDependiente) {
        return fechaDependiente;
      }
    }

    return this.parsearFecha(campo.parametros?.fecha_inicio);
  }

  getNombreCampoLegible(nombreCampo?: string): string {
    return (nombreCampo ?? "").replace(/_/g, " ");
  }

  esCampoDependienteDeshabilitado(nombreCampo?: string): boolean {
    if (!nombreCampo) {
      return false;
    }

    return !!this.form.get(nombreCampo)?.disabled;
  }

  private inicializarDependenciasDeFecha(): void {
    this.formulario?.campos
      ?.filter((campo) => campo.tipo === "date" && campo.parametros?.fecha_minima_dependiente)
      .forEach((campo) => {
        const controlFecha = this.form.get(campo.nombre);
        const nombreDependiente = campo.parametros?.fecha_minima_dependiente;

        if (!controlFecha || !nombreDependiente) {
          return;
        }

        const controlDependiente = this.form.get(nombreDependiente);
        if (!controlDependiente) {
          return;
        }

        const actualizarEstadoFecha = (valorDependiente: any) => {
          const fechaDependiente = this.parsearFecha(valorDependiente);

          if (fechaDependiente) {
            controlFecha.enable({ emitEvent: false });

            const fechaActual = this.parsearFecha(controlFecha.value);
            if (fechaActual && fechaActual < fechaDependiente) {
              controlFecha.setValue(null, { emitEvent: false });
            }
            return;
          }

          controlFecha.setValue(null, { emitEvent: false });
          controlFecha.disable({ emitEvent: false });
        };

        actualizarEstadoFecha(controlDependiente.value);

        this.subscriptions.add(
          controlDependiente.valueChanges.subscribe((valorDependiente) => {
            actualizarEstadoFecha(valorDependiente);
          })
        );
      });
  }

  private parsearFecha(valor: any): Date | null {
    if (!valor) {
      return null;
    }

    if (valor instanceof Date) {
      return isNaN(valor.getTime()) ? null : valor;
    }

    const fecha = new Date(`${String(valor).substring(0, 10)}T00:00:00`);
    return isNaN(fecha.getTime()) ? null : fecha;
  }

  getQuillFormats(quillConfig: any): string[] | undefined {
    try {
      if (!quillConfig?.toolbar) return undefined;
      const formats = new Set<string>();
      for (const group of quillConfig.toolbar) {
        for (const item of group) {
          if (typeof item === "string") {
            formats.add(item);
          } else if (typeof item === "object") {
            Object.keys(item).forEach((k) => formats.add(k));
          }
        }
      }
      return formats.size > 0 ? [...formats] : undefined;
    } catch {
      return undefined;
    }
  }
}
