import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAgregarAuditorComponent } from './modal-agregar-auditor.component';

describe('ModalAgregarAuditorComponent', () => {
  let component: ModalAgregarAuditorComponent;
  let fixture: ComponentFixture<ModalAgregarAuditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAgregarAuditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalAgregarAuditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
