import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalRechazoSeguimientoComponent } from './modal-rechazo-seguimiento.component';

describe('ModalRechazoAuditoriaComponent', () => {
  let component: ModalRechazoSeguimientoComponent;
  let fixture: ComponentFixture<ModalRechazoSeguimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalRechazoSeguimientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalRechazoSeguimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
