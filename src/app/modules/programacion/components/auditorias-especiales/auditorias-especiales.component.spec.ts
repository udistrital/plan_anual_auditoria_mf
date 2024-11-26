import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditoriasEspecialesComponent } from './auditorias-especiales.component';

describe('AuditoriasEspecialesComponent', () => {
  let component: AuditoriasEspecialesComponent;
  let fixture: ComponentFixture<AuditoriasEspecialesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AuditoriasEspecialesComponent]
    });
    fixture = TestBed.createComponent(AuditoriasEspecialesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
