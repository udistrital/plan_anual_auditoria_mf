import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActividadSeguimientoFormularioComponent } from './actividad-formulario.component';

describe('ActividadSeguimientoFormularioComponent', () => {
  let component: ActividadSeguimientoFormularioComponent;
  let fixture: ComponentFixture<ActividadSeguimientoFormularioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActividadSeguimientoFormularioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActividadSeguimientoFormularioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
