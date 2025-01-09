import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalRechazoAuditoriaComponent } from './modal-rechazo-auditoria.component';

describe('ModalRechazoAuditoriaComponent', () => {
  let component: ModalRechazoAuditoriaComponent;
  let fixture: ComponentFixture<ModalRechazoAuditoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalRechazoAuditoriaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalRechazoAuditoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
