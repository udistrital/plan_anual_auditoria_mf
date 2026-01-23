import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AspectosEvaluadosComponent } from './aspectos-evaluados.component';

describe('AspectosEvaluadosComponent', () => {
  let component: AspectosEvaluadosComponent;
  let fixture: ComponentFixture<AspectosEvaluadosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AspectosEvaluadosComponent]
    });
    fixture = TestBed.createComponent(AspectosEvaluadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
