import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TablaPlanMejoramientoComponent } from './tabla-plan-mejoramiento.component';

describe('TablaPlanMejoramientoComponent', () => {
  let component: TablaPlanMejoramientoComponent;
  let fixture: ComponentFixture<TablaPlanMejoramientoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TablaPlanMejoramientoComponent]
    });
    fixture = TestBed.createComponent(TablaPlanMejoramientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});