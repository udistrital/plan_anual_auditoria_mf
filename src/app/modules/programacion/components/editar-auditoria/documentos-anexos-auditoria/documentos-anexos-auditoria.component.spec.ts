import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentosAnexosAuditoriaComponent } from './documentos-anexos-auditoria.component';

describe('DocumentosAnexosAuditoriaComponent', () => {
  let component: DocumentosAnexosAuditoriaComponent;
  let fixture: ComponentFixture<DocumentosAnexosAuditoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentosAnexosAuditoriaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocumentosAnexosAuditoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
