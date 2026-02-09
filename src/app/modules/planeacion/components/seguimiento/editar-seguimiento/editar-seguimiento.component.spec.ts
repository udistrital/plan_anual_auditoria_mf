import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarSeguimientoComponent } from './editar-seguimiento.component';

describe('EditarSeguimientoComponent', () => {
  let component: EditarSeguimientoComponent;
  let fixture: ComponentFixture<EditarSeguimientoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditarSeguimientoComponent]
    });
    fixture = TestBed.createComponent(EditarSeguimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
