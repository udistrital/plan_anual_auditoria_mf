import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalConfirmarRechazoComponent } from './modal-confirmar-rechazo.component';

describe('ModalConfirmarRechazoComponent', () => {
  let component: ModalConfirmarRechazoComponent;
  let fixture: ComponentFixture<ModalConfirmarRechazoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalConfirmarRechazoComponent]
    });
    fixture = TestBed.createComponent(ModalConfirmarRechazoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
