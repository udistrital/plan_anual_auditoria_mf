import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ConsultaPlanAuditoriaComponent } from "./consulta-plan-auditoria.component";

describe("ConsultaPlanAnualAuditoriaComponent", () => {
  let component: ConsultaPlanAuditoriaComponent;
  let fixture: ComponentFixture<ConsultaPlanAuditoriaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsultaPlanAuditoriaComponent],
    });
    fixture = TestBed.createComponent(ConsultaPlanAuditoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
