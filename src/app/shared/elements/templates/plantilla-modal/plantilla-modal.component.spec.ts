import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlantillaModalComponent } from './plantilla-modal.component';

describe('PlantillaModalComponent', () => {
  let component: PlantillaModalComponent;
  let fixture: ComponentFixture<PlantillaModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlantillaModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlantillaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
