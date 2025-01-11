import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaConsultaAuditoriasComponent } from './tabla-consulta-auditorias.component';

describe('TablaConsultaAuditoriasComponent', () => {
  let component: TablaConsultaAuditoriasComponent;
  let fixture: ComponentFixture<TablaConsultaAuditoriasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaConsultaAuditoriasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TablaConsultaAuditoriasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
