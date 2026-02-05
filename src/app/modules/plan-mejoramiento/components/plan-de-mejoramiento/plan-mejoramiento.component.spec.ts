import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanDeMejoramientoComponent } from './plan-mejoramiento.component';

describe('PlanDeMejoramientoComponent', () => {
  let component: PlanDeMejoramientoComponent;
  let fixture: ComponentFixture<PlanDeMejoramientoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PlanDeMejoramientoComponent]
    });
    fixture = TestBed.createComponent(PlanDeMejoramientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});