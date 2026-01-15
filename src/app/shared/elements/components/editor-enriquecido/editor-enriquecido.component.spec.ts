import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorEnriquecidoComponent } from './editor-enriquecido.component';

describe('EditorEnriquecidoComponent', () => {
  let component: EditorEnriquecidoComponent;
  let fixture: ComponentFixture<EditorEnriquecidoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditorEnriquecidoComponent]
    });
    fixture = TestBed.createComponent(EditorEnriquecidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
