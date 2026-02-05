import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalRechazoAuditoriaEjecucionComponent } from './modal-rechazo-auditoria.component';

describe('ModalRechazoAuditoriaEjecucionComponent', () => {
  let component: ModalRechazoAuditoriaEjecucionComponent;
  let fixture: ComponentFixture<ModalRechazoAuditoriaEjecucionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalRechazoAuditoriaEjecucionComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ModalRechazoAuditoriaEjecucionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
