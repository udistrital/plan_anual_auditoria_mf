import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignacionAuditoresComponent } from './asignacion-auditores.component';

describe('AsignacionAuditoresComponent', () => {
  let component: AsignacionAuditoresComponent;
  let fixture: ComponentFixture<AsignacionAuditoresComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AsignacionAuditoresComponent]
    });
    fixture = TestBed.createComponent(AsignacionAuditoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
