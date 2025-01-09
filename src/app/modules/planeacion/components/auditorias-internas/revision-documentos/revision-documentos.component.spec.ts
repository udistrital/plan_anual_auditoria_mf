import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisionDocumentosComponent } from './revision-documentos.component';

describe('RevisionDocumentosComponent', () => {
  let component: RevisionDocumentosComponent;
  let fixture: ComponentFixture<RevisionDocumentosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevisionDocumentosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RevisionDocumentosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
