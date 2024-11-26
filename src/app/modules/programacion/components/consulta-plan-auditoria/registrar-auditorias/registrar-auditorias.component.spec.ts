import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarAuditoriasComponent } from './registrar-auditorias.component';

describe('RegistrarAuditoriasComponent', () => {
  let component: RegistrarAuditoriasComponent;
  let fixture: ComponentFixture<RegistrarAuditoriasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegistrarAuditoriasComponent]
    });
    fixture = TestBed.createComponent(RegistrarAuditoriasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
