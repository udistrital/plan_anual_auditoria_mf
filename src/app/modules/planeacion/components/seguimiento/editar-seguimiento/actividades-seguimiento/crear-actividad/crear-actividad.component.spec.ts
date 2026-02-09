import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearActividadSeguimientoComponent } from './crear-actividad.component';

describe('CrearActividadSeguimientoComponent', () => {
  let component: CrearActividadSeguimientoComponent;
  let fixture: ComponentFixture<CrearActividadSeguimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearActividadSeguimientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CrearActividadSeguimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
