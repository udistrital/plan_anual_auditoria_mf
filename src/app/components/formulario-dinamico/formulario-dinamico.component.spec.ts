import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularioDinamicoComponent } from './formulario-dinamico.component';

describe('FormularioDinamicoComponent', () => {
  let component: FormularioDinamicoComponent;
  let fixture: ComponentFixture<FormularioDinamicoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormularioDinamicoComponent]
    });
    fixture = TestBed.createComponent(FormularioDinamicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
