import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarActividadSeguimientoComponent } from './editar-actividad.component';

describe('EditarActividadSeguimientoComponent', () => {
  let component: EditarActividadSeguimientoComponent;
  let fixture: ComponentFixture<EditarActividadSeguimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarActividadSeguimientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditarActividadSeguimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
