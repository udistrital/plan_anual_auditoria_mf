import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarActividadesComponent } from './editar-actividades.component';

describe('EditarActividadesComponent', () => {
  let component: EditarActividadesComponent;
  let fixture: ComponentFixture<EditarActividadesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditarActividadesComponent]
    });
    fixture = TestBed.createComponent(EditarActividadesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
