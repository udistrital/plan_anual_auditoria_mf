import { Component, OnInit, OnChanges, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { firstValueFrom } from 'rxjs';

interface Subtema {
  _id?: string;
  tema_id?: string;
  activo?: boolean;
  titulo: string;
  isNew?: boolean;
  isModified?: boolean;
}

interface Tema {
  _id?: string;
  informe_id?: string;
  activo?: boolean;
  titulo: string;
  subtema: Subtema[];
  isNew?: boolean;
  isModified?: boolean;
}

@Component({
  selector: 'app-aspectos-evaluados-seguimiento',
  templateUrl: './aspectos-evaluados-seguimiento.component.html',
  styleUrls: ['./aspectos-evaluados-seguimiento.component.css'],
})
export class AspectosEvaluadosSeguimientoComponent implements OnInit, OnChanges {
  @Input() informeId!: string;
  @Output() datosActualizados = new EventEmitter<void>();

  aspectosForm: UntypedFormGroup = this.fb.group({});
  temasData: Tema[] = [];
  cargando = false;
  errorMatcher: ErrorStateMatcher = {
    isErrorState(control: FormControl | null, _form: FormGroupDirective | NgForm | null): boolean {
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

    if (this.informeId) {
      this.cargarTemas();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['informeId'] && this.informeId) {
      this.cargarTemas();
    }
  }

  cargarTemas(): void {
    if (!this.informeId) return;

    this.cargando = true;
    this.planAnualAuditoriaService.get(`tema?query=informe_id:${this.informeId}`).subscribe({
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

  construirFormulario(): void {
    const temasArray = this.fb.array([]);

    this.temasData.forEach((tema) => {
      if (!tema.activo) return;

      const subtemasArray = this.fb.array([]);

      (tema.subtema || []).forEach((subtema: any) => {
        if (!subtema.activo) return;

        subtemasArray.push(this.fb.group({
          _id: [subtema._id || null],
          nombre: [subtema.titulo || '', Validators.required],
          isNew: [false],
          isModified: [false],
        }));
      });

      temasArray.push(this.fb.group({
        _id: [tema._id || null],
        nombre: [tema.titulo || '', Validators.required],
        subtemas: subtemasArray,
        isNew: [false],
        isModified: [false],
      }));
    });

    this.aspectosForm = this.fb.group({ temas: temasArray });
  }

  get temas(): UntypedFormArray {
    return this.aspectosForm.get('temas') as UntypedFormArray;
  }

  agregarTema(): void {
    this.temas.push(this.fb.group({
      _id: [null],
      nombre: ['', Validators.required],
      subtemas: this.fb.array([]),
      isNew: [true],
      isModified: [false],
    }));
  }

  getSubtemas(temaIndex: number): UntypedFormArray {
    return this.temas.at(temaIndex).get('subtemas') as UntypedFormArray;
  }

  agregarSubtema(temaIndex: number): void {
    this.getSubtemas(temaIndex).push(this.fb.group({
      _id: [null],
      nombre: ['', Validators.required],
      isNew: [true],
      isModified: [false],
    }));
  }

  eliminarTema(index: number): void {
    const temaId = this.temas.at(index).get('_id')?.value;

    if (temaId) {
      this.alertaService.showConfirmAlert('¿Eliminar este tema y todos sus subtemas?')
        .then((confirmado) => {
          if (!confirmado.value) return;

          this.planAnualAuditoriaService.delete('tema', { id: temaId }).subscribe({
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

  eliminarSubtema(temaIndex: number, subtemaIndex: number): void {
    const subtemaId = this.getSubtemas(temaIndex).at(subtemaIndex).get('_id')?.value;

    if (subtemaId) {
      this.alertaService.showConfirmAlert('¿Eliminar este subtema?')
        .then((confirmado) => {
          if (!confirmado.value) return;

          this.planAnualAuditoriaService.delete('subtema', { id: subtemaId }).subscribe({
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

  async guardarAspectos(): Promise<boolean> {
    if (this.aspectosForm.invalid) {
      this.aspectosForm.markAllAsTouched();
      this.alertaService.showAlert('Formulario inválido', 'Por favor complete todos los campos requeridos');
      return false;
    }

    const temasFormValue = this.temas.value;

    for (let i = 0; i < temasFormValue.length; i++) {
      const temaForm = temasFormValue[i];
      let temaId = temaForm._id;

      if (!temaId) {
        try {
          const response: any = await firstValueFrom(this.planAnualAuditoriaService.post('tema', {
            informe_id: this.informeId,
            titulo: temaForm.nombre
          }));
          temaId = response?.Data?._id || response?._id || response?.Id;
          this.temas.at(i).patchValue({ _id: temaId, isNew: false });
        } catch (error) {
          console.error('Error al crear tema:', error);
          this.alertaService.showAlert('Error', `No se pudo crear el tema "${temaForm.nombre}"`);
          continue;
        }
      } else {
        try {
          await firstValueFrom(this.planAnualAuditoriaService.put(`tema/${temaId}`, {
            titulo: temaForm.nombre
          }));
        } catch (error) {
          console.error('Error al actualizar tema:', error);
          this.alertaService.showAlert('Error', `No se pudo actualizar el tema "${temaForm.nombre}"`);
        }
      }

      for (let j = 0; j < temaForm.subtemas.length; j++) {
        const subtemaForm = temaForm.subtemas[j];
        let subtemaId = subtemaForm._id;

        if (!subtemaId) {
          try {
            const response: any = await firstValueFrom(this.planAnualAuditoriaService.post('subtema', {
              tema_id: temaId,
              titulo: subtemaForm.nombre
            }));
            const subtemasEnResponse = response?.Data?.subtema || [];
            subtemaId = subtemasEnResponse[subtemasEnResponse.length - 1]?._id;
            this.getSubtemas(i).at(j).patchValue({ _id: subtemaId, isNew: false });
          } catch (error) {
            console.error('Error al crear subtema:', error);
            this.alertaService.showAlert('Error', `No se pudo crear el subtema "${subtemaForm.nombre}"`);
          }
        } else {
          try {
            await firstValueFrom(this.planAnualAuditoriaService.put(`subtema/${subtemaId}`, {
              titulo: subtemaForm.nombre
            }));
          } catch (error) {
            console.error('Error al actualizar subtema:', error);
            this.alertaService.showAlert('Error', `No se pudo actualizar el subtema "${subtemaForm.nombre}"`);
          }
        }
      }
    }

    this.alertaService.showAlert('Guardado exitoso', 'Los aspectos evaluados se han guardado correctamente');
    this.datosActualizados.emit();
    return true;
  }
}
