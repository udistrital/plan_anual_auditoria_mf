import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisionDocumentosEjecucionComponent } from './revision-documentos.component';

describe('RevisionDocumentosEjecucionComponent', () => {
  let component: RevisionDocumentosEjecucionComponent;
  let fixture: ComponentFixture<RevisionDocumentosEjecucionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevisionDocumentosEjecucionComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RevisionDocumentosEjecucionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
