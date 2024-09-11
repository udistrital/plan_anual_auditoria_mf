import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalGeneral } from './modal-general';

describe('ModalGeneral', () => {
  let component: ModalGeneral;
  let fixture: ComponentFixture<ModalGeneral>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalGeneral]
    });
    fixture = TestBed.createComponent(ModalGeneral);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
