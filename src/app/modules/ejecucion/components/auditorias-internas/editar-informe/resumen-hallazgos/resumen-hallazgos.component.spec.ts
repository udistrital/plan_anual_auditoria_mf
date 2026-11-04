import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumenHallazgosComponent } from './resumen-hallazgos.component';

describe('ResumenHallazgosComponent', () => {
  let component: ResumenHallazgosComponent;
  let fixture: ComponentFixture<ResumenHallazgosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ResumenHallazgosComponent]
    });
    fixture = TestBed.createComponent(ResumenHallazgosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el texto corto del hallazgo y no su descripción', () => {
    const temas = [{ activo: true, subtema: [{ _id: 's1', activo: true }] }];
    const hallazgos = [{
      _id: 'h1',
      subtema_id: 's1',
      criterio: 'Resolución No. 129 de 2022',
      titulo: 'Rezago en el plaqueteo de los bienes',
      descripcion: 'Justificación: párrafo largo con el detalle del hallazgo.',
    }];
    component.temasRaw = temas;
    component.hallazgosRaw = hallazgos;

    component.ngOnChanges({
      temasRaw: new SimpleChange(null, temas, true),
      hallazgosRaw: new SimpleChange(null, hallazgos, true),
    });

    expect(component.hallazgos).toEqual([{
      numero: '2.1.1',
      criterio: 'Resolución No. 129 de 2022',
      descripcion: 'Rezago en el plaqueteo de los bienes',
    }]);
  });
});
