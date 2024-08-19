import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroPlanAnualAuditoriaComponent } from './registro-plan-anual-auditoria.component';

describe('RegistroPlanAnualAuditoriaComponent', () => {
  let component: RegistroPlanAnualAuditoriaComponent;
  let fixture: ComponentFixture<RegistroPlanAnualAuditoriaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegistroPlanAnualAuditoriaComponent]
    });
    fixture = TestBed.createComponent(RegistroPlanAnualAuditoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
