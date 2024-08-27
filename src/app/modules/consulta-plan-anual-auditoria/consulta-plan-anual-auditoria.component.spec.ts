import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultaPlanAnualAuditoriaComponent } from './consulta-plan-anual-auditoria.component';

describe('ConsultaPlanAnualAuditoriaComponent', () => {
  let component: ConsultaPlanAnualAuditoriaComponent;
  let fixture: ComponentFixture<ConsultaPlanAnualAuditoriaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsultaPlanAnualAuditoriaComponent]
    });
    fixture = TestBed.createComponent(ConsultaPlanAnualAuditoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
