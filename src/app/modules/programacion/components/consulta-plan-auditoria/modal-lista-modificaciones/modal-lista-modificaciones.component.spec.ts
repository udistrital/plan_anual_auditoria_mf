import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalListaModificacionesComponent } from './modal-lista-modificaciones.component';

describe('ModalListaModificacionesComponent', () => {
  let component: ModalListaModificacionesComponent;
  let fixture: ComponentFixture<ModalListaModificacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalListaModificacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalListaModificacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
