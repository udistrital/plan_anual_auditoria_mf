import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AspectosGeneralesComponent } from './aspectos-generales.component';

describe('AspectosGeneralesComponent', () => {
  let component: AspectosGeneralesComponent;
  let fixture: ComponentFixture<AspectosGeneralesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AspectosGeneralesComponent]
    });
    fixture = TestBed.createComponent(AspectosGeneralesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
