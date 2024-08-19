import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionAuditoriaComponent } from './gestion-auditoria.component';

describe('GestionAuditoriaComponent', () => {
  let component: GestionAuditoriaComponent;
  let fixture: ComponentFixture<GestionAuditoriaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GestionAuditoriaComponent]
    });
    fixture = TestBed.createComponent(GestionAuditoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
