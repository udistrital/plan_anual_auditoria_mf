import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AsignarAuditoriasComponent } from "./asignar-auditorias.component";

describe("AsignacionAuditoresComponent", () => {
  let component: AsignarAuditoriasComponent;
  let fixture: ComponentFixture<AsignarAuditoriasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AsignarAuditoriasComponent],
    });
    fixture = TestBed.createComponent(AsignarAuditoriasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
