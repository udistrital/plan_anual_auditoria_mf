import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAuditoriaModalComponent } from './add-auditoria-modal.component';

describe('AddAuditoriaModalComponent', () => {
  let component: AddAuditoriaModalComponent;
  let fixture: ComponentFixture<AddAuditoriaModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAuditoriaModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddAuditoriaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
