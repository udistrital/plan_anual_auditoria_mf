import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisionPlanAuditoriaComponent } from './revision-plan-auditoria.component';

describe('RevisionPlanAuditoriaComponent', () => {
  let component: RevisionPlanAuditoriaComponent;
  let fixture: ComponentFixture<RevisionPlanAuditoriaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RevisionPlanAuditoriaComponent]
    });
    fixture = TestBed.createComponent(RevisionPlanAuditoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
