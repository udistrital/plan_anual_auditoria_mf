import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalEnviarAprobacionComponent } from './modal-enviar-aprobacion.component';

describe('ModalEnviarAprobacionComponent', () => {
  let component: ModalEnviarAprobacionComponent;
  let fixture: ComponentFixture<ModalEnviarAprobacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalEnviarAprobacionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalEnviarAprobacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});