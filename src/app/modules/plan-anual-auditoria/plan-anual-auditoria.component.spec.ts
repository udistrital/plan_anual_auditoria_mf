import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanAnualAuditoriaComponent } from './plan-anual-auditoria.component';

describe('PlanAnualAuditoriaComponent', () => {
  let component: PlanAnualAuditoriaComponent;
  let fixture: ComponentFixture<PlanAnualAuditoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanAnualAuditoriaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanAnualAuditoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
