import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisionSecretarioComponent } from './revision-secretario.component';

describe('RevisionSecretarioComponent', () => {
  let component: RevisionSecretarioComponent;
  let fixture: ComponentFixture<RevisionSecretarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevisionSecretarioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RevisionSecretarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
