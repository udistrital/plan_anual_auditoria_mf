import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarAuditoriaComponent } from './editar-auditoria.component';

describe('EditarAuditoriaComponent', () => {
  let component: EditarAuditoriaComponent;
  let fixture: ComponentFixture<EditarAuditoriaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditarAuditoriaComponent]
    });
    fixture = TestBed.createComponent(EditarAuditoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
