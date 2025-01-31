import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalVisualizarRecargarDocumentoComponent } from './modal-visualizar-recargar-documento.component';

describe('ModalVisualizarRecargarDocumentoComponent', () => {
  let component: ModalVisualizarRecargarDocumentoComponent;
  let fixture: ComponentFixture<ModalVisualizarRecargarDocumentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalVisualizarRecargarDocumentoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalVisualizarRecargarDocumentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
