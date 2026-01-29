import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaAuditoriasEspecialesComponent } from './tabla-auditorias-especiales.component';

describe('TablaAuditoriasEspecialesComponent', () => {
  let component: TablaAuditoriasEspecialesComponent;
  let fixture: ComponentFixture<TablaAuditoriasEspecialesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaAuditoriasEspecialesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TablaAuditoriasEspecialesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
