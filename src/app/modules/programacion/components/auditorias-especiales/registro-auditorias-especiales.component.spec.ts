import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RegistroAuditoriasEspecialesComponent } from "./registro-auditorias-especiales.component";

describe("AuditoriasEspecialesComponent", () => {
  let component: RegistroAuditoriasEspecialesComponent;
  let fixture: ComponentFixture<RegistroAuditoriasEspecialesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegistroAuditoriasEspecialesComponent],
    });
    fixture = TestBed.createComponent(RegistroAuditoriasEspecialesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
