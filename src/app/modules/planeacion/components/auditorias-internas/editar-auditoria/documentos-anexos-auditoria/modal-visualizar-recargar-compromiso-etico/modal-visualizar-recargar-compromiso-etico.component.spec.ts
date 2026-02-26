import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalVisualizarRecargarCompromisoEticoComponent } from './modal-visualizar-recargar-compromiso-etico.component';

describe('ModalVisualizarRecargarCompromisoEticoComponent', () => {
  let component: ModalVisualizarRecargarCompromisoEticoComponent;
  let fixture: ComponentFixture<ModalVisualizarRecargarCompromisoEticoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalVisualizarRecargarCompromisoEticoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalVisualizarRecargarCompromisoEticoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
