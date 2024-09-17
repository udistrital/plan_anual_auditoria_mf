import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalRevisionPlanAuditoriaComponent } from './modal-revision-plan-auditoria.component';

describe('ModalRevisionPlanAuditoriaComponent', () => {
  let component: ModalRevisionPlanAuditoriaComponent;
  let fixture: ComponentFixture<ModalRevisionPlanAuditoriaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalRevisionPlanAuditoriaComponent]
    });
    fixture = TestBed.createComponent(ModalRevisionPlanAuditoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
