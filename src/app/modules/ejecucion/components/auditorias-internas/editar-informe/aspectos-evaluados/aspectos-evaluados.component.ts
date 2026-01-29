import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { firstValueFrom } from 'rxjs';

interface Hallazgo {
  _id?: string;
  subtema_id?: string;
  titulo: string;
  criterio: string;
  descripcion: string;
  isNew?: boolean;
  isModified?: boolean;
}

interface Subtema {
  _id?: string;
  tema_id?: string;
  titulo: string;
  hallazgos: Hallazgo[];
  isNew?: boolean;
  isModified?: boolean;
}

interface Tema {
  _id?: string;
  informe_id?: string;
  titulo: string;
  subtema: Subtema[];
  isNew?: boolean;
  isModified?: boolean;
}

@Component({
  selector: 'app-aspectos-evaluados',
  templateUrl: './aspectos-evaluados.component.html',
  styleUrls: ['./aspectos-evaluados.component.css'],
})
export class AspectosEvaluadosComponent implements OnInit, OnChanges {
  @Input() informeId!: string;
  @Output() datosActualizados = new EventEmitter<void>();

  aspectosForm: UntypedFormGroup = this.fb.group({});
  temasData: Tema[] = [];
  cargando = false;
  errorMatcher: ErrorStateMatcher = {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
      return !!(control && control.invalid && (control.dirty || control.touched));
    }
  };

  constructor(
    private fb: UntypedFormBuilder,
    private planAnualAuditoriaService: PlanAnualAuditoriaService,
    private alertaService: AlertService
  ) { }

  ngOnInit(): void {
    this.aspectosForm = this.fb.group({
      temas: this.fb.array([]),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['informeId'] && this.informeId) {
      this.cargarTemas();
    }
  }

  // Carga los temas, subtemas y hallazgos desde la base de datos
  cargarTemas(): void {
    if (!this.informeId) return;

    this.cargando = true;
    this.planAnualAuditoriaService.get(`informe/${this.informeId}/tema`).subscribe({
      next: (response: any) => {
        this.temasData = response?.Data || [];
        this.construirFormulario();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar temas:', error);
        this.cargando = false;
      }
    });
  }

  // Construye el formulario reactivo con los datos cargados
  construirFormulario(): void {
    const temasArray = this.fb.array([]);

    this.temasData.forEach((tema) => {
      const subtemasArray = this.fb.array([]);

      (tema.subtema || []).forEach((subtema: any) => {
        const hallazgosArray = this.fb.array([]);

        (subtema.hallazgo || []).forEach((hallazgo: any) => {
          hallazgosArray.push(this.fb.group({
            _id: [hallazgo._id || null],
            criterio: [hallazgo.criterio || '', Validators.required],
            hallazgo: [hallazgo.titulo || '', Validators.required],
            descripcion: [hallazgo.descripcion || '', Validators.required],
            isNew: [false],
            isModified: [false]
          }));
        });

        subtemasArray.push(this.fb.group({
          _id: [subtema._id || null],
          nombre: [subtema.titulo || ''],
          hallazgos: hallazgosArray,
          isNew: [false],
          isModified: [false]
        }));
      });

      temasArray.push(this.fb.group({
        _id: [tema._id || null],
        nombre: [tema.titulo || ''],
        subtemas: subtemasArray,
        isNew: [false],
        isModified: [false]
      }));
    });

    this.aspectosForm = this.fb.group({
      temas: temasArray,
    });
  }

  get temas(): UntypedFormArray {
    return this.aspectosForm.get('temas') as UntypedFormArray;
  }

  agregarTema(): void {
    const nuevoTema = this.fb.group({
      _id: [null],
      nombre: [''],
      subtemas: this.fb.array([]),
      isNew: [true],
      isModified: [false]
    });
    this.temas.push(nuevoTema);
  }

  getSubtemas(temaIndex: number): UntypedFormArray {
    return this.temas.at(temaIndex).get('subtemas') as UntypedFormArray;
  }

  agregarSubtema(temaIndex: number): void {
    const nuevoSubtema = this.fb.group({
      _id: [null],
      nombre: [''],
      hallazgos: this.fb.array([]),
      isNew: [true],
      isModified: [false]
    });
    this.getSubtemas(temaIndex).push(nuevoSubtema);
  }

  getHallazgos(temaIndex: number, subtemaIndex: number): UntypedFormArray {
    return this.getSubtemas(temaIndex).at(subtemaIndex).get('hallazgos') as UntypedFormArray;
  }

  agregarHallazgo(temaIndex: number, subtemaIndex: number): void {
    const nuevoHallazgo = this.fb.group({
      _id: [null],
      criterio: ['', Validators.required],
      hallazgo: ['', Validators.required],
      descripcion: ['', Validators.required],
      isNew: [true],
      isModified: [false]
    });
    this.getHallazgos(temaIndex, subtemaIndex).push(nuevoHallazgo);
  }

  // Elimina un tema y sus subtemas/hallazgos en cascada
  eliminarTema(index: number): void {
    const tema = this.temas.at(index);
    const temaId = tema.get('_id')?.value;

    if (temaId) {
      this.alertaService.showConfirmAlert('¿Eliminar este tema y todos sus subtemas y hallazgos?')
        .then((confirmado) => {
          if (!confirmado.value) return;

          this.planAnualAuditoriaService.delete("tema", {id: temaId}).subscribe({
            next: () => {
              this.temas.removeAt(index);
              this.alertaService.showAlert('Eliminado', 'El tema ha sido eliminado correctamente');
              this.datosActualizados.emit();
            },
            error: (error) => {
              console.error('Error al eliminar tema:', error);
              this.alertaService.showAlert('Error', 'No se pudo eliminar el tema');
            }
          });
        });
    } else {
      this.temas.removeAt(index);
    }
  }

  // Elimina un subtema y sus hallazgos en cascada
  eliminarSubtema(temaIndex: number, subtemaIndex: number): void {
    const tema = this.temas.at(temaIndex);
    const subtema = this.getSubtemas(temaIndex).at(subtemaIndex);
    const temaId = tema.get('_id')?.value;
    const subtemaId = subtema.get('_id')?.value;

    if (temaId && subtemaId) {
      this.alertaService.showConfirmAlert('¿Eliminar este subtema y todos sus hallazgos?')
        .then((confirmado) => {
          if (!confirmado.value) return;

          this.planAnualAuditoriaService.delete(`tema/${temaId}/subtemas`, {id: subtemaId}).subscribe({
            next: () => {
              this.getSubtemas(temaIndex).removeAt(subtemaIndex);
              this.alertaService.showAlert('Eliminado', 'El subtema ha sido eliminado correctamente');
              this.datosActualizados.emit();
            },
            error: (error) => {
              console.error('Error al eliminar subtema:', error);
              this.alertaService.showAlert('Error', 'No se pudo eliminar el subtema');
            }
          });
        });
    } else {
      this.getSubtemas(temaIndex).removeAt(subtemaIndex);
    }
  }

  // Elimina un hallazgo
  eliminarHallazgo(temaIndex: number, subtemaIndex: number, hallazgoIndex: number): void {
    const tema = this.temas.at(temaIndex);
    const subtema = this.getSubtemas(temaIndex).at(subtemaIndex);
    const hallazgo = this.getHallazgos(temaIndex, subtemaIndex).at(hallazgoIndex);
    const temaId = tema.get('_id')?.value;
    const subtemaId = subtema.get('_id')?.value;
    const hallazgoId = hallazgo.get('_id')?.value;

    if (temaId && subtemaId && hallazgoId) {
      this.alertaService.showConfirmAlert('¿Eliminar este hallazgo?')
        .then((confirmado) => {
          if (!confirmado.value) return;

          this.planAnualAuditoriaService.delete(`tema/${temaId}/subtemas/${subtemaId}/hallazgos`, {id: hallazgoId}).subscribe({
            next: () => {
              this.getHallazgos(temaIndex, subtemaIndex).removeAt(hallazgoIndex);
              this.alertaService.showAlert('Eliminado', 'El hallazgo ha sido eliminado correctamente');
              this.datosActualizados.emit();
            },
            error: (error) => {
              console.error('Error al eliminar hallazgo:', error);
              this.alertaService.showAlert('Error', 'No se pudo eliminar el hallazgo');
            }
          });
        });
    } else {
      this.getHallazgos(temaIndex, subtemaIndex).removeAt(hallazgoIndex);
    }
  }

  //  Guarda todos los aspectos evaluados (temas, subtemas, hallazgos)
  async guardarAspectos(): Promise<void> {
    // Validar formulario
    if (this.aspectosForm.invalid) {
      this.aspectosForm.markAllAsTouched();
      this.alertaService.showAlert('Formulario inválido', 'Por favor complete todos los campos requeridos');
      return;
    }

    const temasFormValue = this.temas.value;

    for (let i = 0; i < temasFormValue.length; i++) {
      const temaForm = temasFormValue[i];
      let temaId = temaForm._id;

      // Crear o actualizar tema
      if (!temaId) {
        try {
          const response: any = await firstValueFrom(this.planAnualAuditoriaService.post("tema", {
            informe_id: this.informeId,
            titulo: temaForm.nombre
          }));
          temaId = response?.Data?._id || response?._id || response?.Id;
          this.temas.at(i).patchValue({ _id: temaId, isNew: false });
        } catch (error) {
          console.error('Error al crear tema:', error);
          continue;
        }
      } else {
        try {
          await firstValueFrom(this.planAnualAuditoriaService.put(`tema/${temaId}`, {
            informe_id: this.informeId,
            titulo: temaForm.nombre,
            Id: null
          }));
        } catch (error) {
          console.error('Error al actualizar tema:', error);
        }
      }

      // Procesar subtemas
      for (let j = 0; j < temaForm.subtemas.length; j++) {
        const subtemaForm = temaForm.subtemas[j];
        let subtemaId = subtemaForm._id;

        // Crear o actualizar subtema
        if (!subtemaId) {
          try {
            const response: any = await firstValueFrom(this.planAnualAuditoriaService.post(`tema/${temaId}/subtemas`, {
              titulo: subtemaForm.nombre
            }));
            // El servidor devuelve el tema completo, buscar el subtema recién creado
            const subtemas = response?.Data?.subtema || [];
            const ultimoSubtema = subtemas[subtemas.length - 1];
            subtemaId = ultimoSubtema?._id;
            this.getSubtemas(i).at(j).patchValue({ _id: subtemaId, isNew: false });
          } catch (error) {
            console.error('Error al crear subtema:', error);
            continue;
          }
        } else {
          try {
            await firstValueFrom(this.planAnualAuditoriaService.put(`tema/${temaId}/subtemas/${subtemaId}`, {
              titulo: subtemaForm.nombre,
              Id: null
            }));
          } catch (error) {
            console.error('Error al actualizar subtema:', error);
          }
        }

        // Procesar hallazgos
        for (let k = 0; k < subtemaForm.hallazgos.length; k++) {
          const hallazgoForm = subtemaForm.hallazgos[k];
          let hallazgoId = hallazgoForm._id;

          // Crear o actualizar hallazgo
          if (!hallazgoId) {
            try {
              const response: any = await firstValueFrom(this.planAnualAuditoriaService.post(`tema/${temaId}/subtemas/${subtemaId}/hallazgos`, {
                titulo: hallazgoForm.hallazgo,
                criterio: hallazgoForm.criterio,
                descripcion: hallazgoForm.descripcion
              }));
              // El servidor devuelve el tema completo, buscar el hallazgo recién creado
              const subtemaActualizado = response?.Data?.subtema?.find((s: any) => s._id === subtemaId);
              const hallazgos = subtemaActualizado?.hallazgo || [];
              const ultimoHallazgo = hallazgos[hallazgos.length - 1];
              hallazgoId = ultimoHallazgo?._id;
              this.getHallazgos(i, j).at(k).patchValue({ _id: hallazgoId, isNew: false });
            } catch (error) {
              console.error('Error al crear hallazgo:', error);
            }
          } else {
            try {
              await firstValueFrom(this.planAnualAuditoriaService.put(`tema/${temaId}/subtemas/${subtemaId}/hallazgos/${hallazgoId}`, {
                titulo: hallazgoForm.hallazgo,
                criterio: hallazgoForm.criterio,
                descripcion: hallazgoForm.descripcion,
                Id: null
              }));
            } catch (error) {
              console.error('Error al actualizar hallazgo:', error);
            }
          }
        }
      }
    }

    this.alertaService.showAlert('Guardado exitoso', 'Los aspectos evaluados se han guardado correctamente');
    this.datosActualizados.emit();
  }
}
