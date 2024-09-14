import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularioAuditoriaEspecialComponent } from './formulario-auditoria-especial.component';

describe('FormularioAuditoriaEspecialComponent', () => {
  let component: FormularioAuditoriaEspecialComponent;
  let fixture: ComponentFixture<FormularioAuditoriaEspecialComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormularioAuditoriaEspecialComponent]
    });
    fixture = TestBed.createComponent(FormularioAuditoriaEspecialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
