import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-aspectos-evaluados',
  templateUrl: './aspectos-evaluados.component.html',
  styleUrls: ['./aspectos-evaluados.component.css'],
})
export class AspectosEvaluadosComponent implements OnInit {
  aspectosForm: FormGroup = this.fb.group({});

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.aspectosForm = this.fb.group({
      temas: this.fb.array([]),
    });
  }

  get temas(): FormArray {
    return this.aspectosForm.get('temas') as FormArray;
  }

  agregarTema(): void {
    this.temas.push(this.fb.group({
      nombre: [''],
      subtemas: this.fb.array([]),
    }));
  }

  getSubtemas(temaIndex: number): FormArray {
    return this.temas.at(temaIndex).get('subtemas') as FormArray;
  }

  agregarSubtema(temaIndex: number): void {
    this.getSubtemas(temaIndex).push(this.fb.group({
      nombre: [''],
      hallazgos: this.fb.array([]),
    }));
  }

  getHallazgos(temaIndex: number, subtemaIndex: number): FormArray {
    return this.getSubtemas(temaIndex).at(subtemaIndex).get('hallazgos') as FormArray;
  }

  agregarHallazgo(temaIndex: number, subtemaIndex: number): void {
    this.getHallazgos(temaIndex, subtemaIndex).push(this.fb.group({
      criterio: [''],
      hallazgo: [''],
      descripcion: [''],
    }));
  }

  eliminarTema(index: number): void {
    this.temas.removeAt(index);
  }

  eliminarSubtema(temaIndex: number, subtemaIndex: number): void {
    this.getSubtemas(temaIndex).removeAt(subtemaIndex);
  }

  eliminarHallazgo(temaIndex: number, subtemaIndex: number, hallazgoIndex: number): void {
    this.getHallazgos(temaIndex, subtemaIndex).removeAt(hallazgoIndex);
  }

  guardarAspectos(): void {
    console.log('Formulario de aspectos guardado:', this.aspectosForm.value);
  }
}
