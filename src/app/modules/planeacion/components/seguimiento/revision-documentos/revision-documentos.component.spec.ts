import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisionDocumentosSeguimientoComponent } from './revision-documentos.component';

describe('RevisionDocumentosSeguimientoComponent', () => {
  let component: RevisionDocumentosSeguimientoComponent;
  let fixture: ComponentFixture<RevisionDocumentosSeguimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevisionDocumentosSeguimientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RevisionDocumentosSeguimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
