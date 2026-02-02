import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentosAnexosSeguimientoComponent } from './documentos-anexos-seguimiento.component';

describe('DocumentosAnexosSeguimientoComponent', () => {
  let component: DocumentosAnexosSeguimientoComponent;
  let fixture: ComponentFixture<DocumentosAnexosSeguimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentosAnexosSeguimientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocumentosAnexosSeguimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
