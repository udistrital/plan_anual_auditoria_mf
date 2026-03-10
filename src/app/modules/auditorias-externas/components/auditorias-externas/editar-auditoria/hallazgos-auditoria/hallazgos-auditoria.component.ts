import { Component, OnInit, OnChanges, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { PlanAnualAuditoriaService } from 'src/app/core/services/plan-anual-auditoria.service';
import { AlertService } from 'src/app/shared/services/alert.service';

export interface HallazgoResumen {
  numero: string;
  criterio: string;
  descripcion: string;
}

@Component({
  selector: 'app-hallazgos-auditoria',
  templateUrl: './hallazgos-auditoria.component.html',
  styleUrls: ['./hallazgos-auditoria.component.css']
})
export class HallazgosAuditoriaComponent implements OnInit, OnChanges {
  @Input() auditoriaId!: string;
  @Output() hallazgosActualizados = new EventEmitter<HallazgoResumen[]>();

  hallazgosForm: UntypedFormGroup = this.fb.group({ hallazgos: this.fb.array([]) });
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
  ) {}

  ngOnInit(): void {
    if (this.auditoriaId) this.cargarHallazgos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['auditoriaId'] && this.auditoriaId) this.cargarHallazgos();
  }

  get hallazgos(): UntypedFormArray {
    return this.hallazgosForm.get('hallazgos') as UntypedFormArray;
  }

  cargarHallazgos(): void {
    this.cargando = true;
    this.planAnualAuditoriaService.get(`tema?query=auditoria_id:${this.auditoriaId}`).subscribe({
      next: (response: any) => {
        const temas = response?.Data || [];
        const hallazgosArray = this.fb.array([]);
        let temaCount = 0;

        for (const tema of temas) {
          if (!tema.activo) continue;
          temaCount++;
          let subtemaCount = 0;

          for (const subtema of tema.subtema || []) {
            if (!subtema.activo) continue;
            subtemaCount++;
            let hallazgoCount = 0;

            for (const hallazgo of subtema.hallazgo || []) {
              if (!hallazgo.activo) continue;
              hallazgoCount++;
              hallazgosArray.push(this.fb.group({
                criterio: [hallazgo.criterio || '', Validators.required],
                hallazgo: [hallazgo.titulo || '', Validators.required],
                descripcion: [hallazgo.descripcion || '', Validators.required],
              }));
            }
          }
        }

        this.hallazgosForm = this.fb.group({ hallazgos: hallazgosArray });
        this.emitirHallazgos();
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  agregarHallazgo(): void {
    this.hallazgos.push(this.fb.group({
      criterio: ['', Validators.required],
      hallazgo: ['', Validators.required],
      descripcion: ['', Validators.required],
    }));
    this.emitirHallazgos();
  }

  eliminarHallazgo(index: number): void {
    this.alertaService.showConfirmAlert('¿Eliminar este hallazgo?').then((confirmado) => {
      if (!confirmado.value) return;
      this.hallazgos.removeAt(index);
      this.emitirHallazgos();
    });
  }

  emitirHallazgos(): void {
    const lista: HallazgoResumen[] = this.hallazgos.value.map((h: any, i: number) => ({
      numero: `1.1.${i + 1}`,
      criterio: h.criterio,
      descripcion: h.hallazgo,
    }));
    this.hallazgosActualizados.emit(lista);
  }
}
