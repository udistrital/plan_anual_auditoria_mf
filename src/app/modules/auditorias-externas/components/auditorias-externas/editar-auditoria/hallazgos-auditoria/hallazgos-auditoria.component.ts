import { Component, OnInit, OnChanges, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
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
    console.log("Cargando hallazgos para auditoría ID:", this.auditoriaId);
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
