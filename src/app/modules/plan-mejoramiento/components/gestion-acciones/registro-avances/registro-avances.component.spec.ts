import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroAvancesComponent } from './registro-avances.component';

describe('RegistroAvancesComponent', () => {
  let component: RegistroAvancesComponent;
  let fixture: ComponentFixture<RegistroAvancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroAvancesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroAvancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
