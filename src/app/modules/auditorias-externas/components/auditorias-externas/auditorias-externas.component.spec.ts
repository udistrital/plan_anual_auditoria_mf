import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditoriasExternasComponent } from './auditorias-externas.component';

describe('AuditoriasExternasComponent', () => {
  let component: AuditoriasExternasComponent;
  let fixture: ComponentFixture<AuditoriasExternasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AuditoriasExternasComponent]
    });
    fixture = TestBed.createComponent(AuditoriasExternasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
