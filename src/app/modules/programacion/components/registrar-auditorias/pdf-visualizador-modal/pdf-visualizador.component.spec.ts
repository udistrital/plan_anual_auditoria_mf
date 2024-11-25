import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ModalPdfVisualizadorComponent } from "./pdf-visualizador.component";

describe("PdfVisualizadorComponent", () => {
  let component: ModalPdfVisualizadorComponent;
  let fixture: ComponentFixture<ModalPdfVisualizadorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalPdfVisualizadorComponent],
    });
    fixture = TestBed.createComponent(ModalPdfVisualizadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
