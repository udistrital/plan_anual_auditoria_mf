import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaAuditoriasExternasComponent } from './tabla-auditorias-externas.component';

describe('TablaAuditoriasExternasComponent', () => {
  let component: TablaAuditoriasExternasComponent;
  let fixture: ComponentFixture<TablaAuditoriasExternasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TablaAuditoriasExternasComponent]
    });
    fixture = TestBed.createComponent(TablaAuditoriasExternasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
