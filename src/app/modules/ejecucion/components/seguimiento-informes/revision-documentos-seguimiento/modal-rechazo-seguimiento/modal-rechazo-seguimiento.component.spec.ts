import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalRechazoSeguimientoComponent } from './modal-rechazo-seguimiento.component';

describe('ModalRechazoSeguimientoComponent', () => {
  let component: ModalRechazoSeguimientoComponent;
  let fixture: ComponentFixture<ModalRechazoSeguimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalRechazoSeguimientoComponent ]
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
