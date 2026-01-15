import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeguimientoInformesComponent } from './seguimiento-informes.component';

describe('SeguimientoInformesComponent', () => {
  let component: SeguimientoInformesComponent;
  let fixture: ComponentFixture<SeguimientoInformesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SeguimientoInformesComponent]
    });
    fixture = TestBed.createComponent(SeguimientoInformesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
