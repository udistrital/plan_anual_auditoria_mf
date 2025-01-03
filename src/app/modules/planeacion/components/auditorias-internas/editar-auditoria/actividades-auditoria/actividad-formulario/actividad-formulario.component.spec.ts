import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActividadFormularioComponent } from './actividad-formulario.component';

describe('ActividadFormularioComponent', () => {
  let component: ActividadFormularioComponent;
  let fixture: ComponentFixture<ActividadFormularioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActividadFormularioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActividadFormularioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
