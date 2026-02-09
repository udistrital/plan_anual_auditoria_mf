import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaSeguimientoComponent } from './tabla-seguimiento.component';

describe('TablaAuditoriasInternasComponent', () => {
  let component: TablaSeguimientoComponent;
  let fixture: ComponentFixture<TablaSeguimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaSeguimientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TablaSeguimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
