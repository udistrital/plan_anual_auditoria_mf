import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalVerDocumentosPlanComponent } from './modal-ver-documentos-plan.component';

describe('ModalVerDocumentosPlanComponent', () => {
  let component: ModalVerDocumentosPlanComponent;
  let fixture: ComponentFixture<ModalVerDocumentosPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalVerDocumentosPlanComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalVerDocumentosPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
