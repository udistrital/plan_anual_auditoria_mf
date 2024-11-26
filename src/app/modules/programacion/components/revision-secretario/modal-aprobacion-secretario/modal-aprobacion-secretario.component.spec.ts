import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAprobacionSecretarioComponent } from './modal-aprobacion-secretario.component';

describe('ModalAprobacionSecretarioComponent', () => {
  let component: ModalAprobacionSecretarioComponent;
  let fixture: ComponentFixture<ModalAprobacionSecretarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAprobacionSecretarioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalAprobacionSecretarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
