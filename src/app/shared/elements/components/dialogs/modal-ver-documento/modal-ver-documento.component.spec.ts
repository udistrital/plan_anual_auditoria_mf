import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalVerDocumentoComponent } from './modal-ver-documento.component';

describe('ModalVerDocumentoComponent', () => {
  let component: ModalVerDocumentoComponent;
  let fixture: ComponentFixture<ModalVerDocumentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalVerDocumentoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalVerDocumentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
