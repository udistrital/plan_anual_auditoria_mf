import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ModalListaRechazosComponent } from "./modal-lista-rechazos.component";

describe("ModalMotivosRechazoComponent", () => {
  let component: ModalListaRechazosComponent;
  let fixture: ComponentFixture<ModalListaRechazosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalListaRechazosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalListaRechazosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
