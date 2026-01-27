import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaSeguimientosComponent } from './tabla-seguimientos.component';

describe('TablaSeguimientosComponent', () => {
  let component: TablaSeguimientosComponent;
  let fixture: ComponentFixture<TablaSeguimientosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TablaSeguimientosComponent]
    });
    fixture = TestBed.createComponent(TablaSeguimientosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});