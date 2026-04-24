import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAprobacionAuditadoComponent } from './modal-aprobacion-auditado.component';

describe('ModalAprobacionAuditadoComponent', () => {
  let component: ModalAprobacionAuditadoComponent;
  let fixture: ComponentFixture<ModalAprobacionAuditadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAprobacionAuditadoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalAprobacionAuditadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
