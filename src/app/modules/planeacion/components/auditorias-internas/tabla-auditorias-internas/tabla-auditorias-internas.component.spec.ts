import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaAuditoriasInternasComponent } from './tabla-auditorias-internas.component';

describe('TablaAuditoriasInternasComponent', () => {
  let component: TablaAuditoriasInternasComponent;
  let fixture: ComponentFixture<TablaAuditoriasInternasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaAuditoriasInternasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TablaAuditoriasInternasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
