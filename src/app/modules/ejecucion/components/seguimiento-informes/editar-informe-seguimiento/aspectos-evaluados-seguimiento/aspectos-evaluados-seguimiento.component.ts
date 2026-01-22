import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-aspectos-evaluados-seguimiento',
  templateUrl: './aspectos-evaluados-seguimiento.component.html',
  styleUrls: ['./aspectos-evaluados-seguimiento.component.css'],
})
export class AspectosEvaluadosSeguimientoComponent implements OnInit {
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
    }));
  }

  eliminarTema(index: number): void {
    this.temas.removeAt(index);
  }

  eliminarSubtema(temaIndex: number, subtemaIndex: number): void {
    this.getSubtemas(temaIndex).removeAt(subtemaIndex);
  }

  guardarAspectos(): void {
    console.log('Formulario de aspectos guardado:', this.aspectosForm.value);
  }
}
