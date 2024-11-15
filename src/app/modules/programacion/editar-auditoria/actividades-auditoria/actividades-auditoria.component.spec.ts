import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActividadesAuditoriaComponent } from './actividades-auditoria.component';

describe('ActividadesAuditoriaComponent', () => {
  let component: ActividadesAuditoriaComponent;
  let fixture: ComponentFixture<ActividadesAuditoriaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ActividadesAuditoriaComponent]
    });
    fixture = TestBed.createComponent(ActividadesAuditoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
