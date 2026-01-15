import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditoriasInternasComponent } from './auditorias-internas.component';

describe('AuditoriasInternasComponent', () => {
  let component: AuditoriasInternasComponent;
  let fixture: ComponentFixture<AuditoriasInternasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AuditoriasInternasComponent]
    });
    fixture = TestBed.createComponent(AuditoriasInternasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
