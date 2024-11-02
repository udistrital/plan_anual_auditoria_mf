import { ComponentFixture, TestBed } from '@angular/core/testing';

import { revisionJefeComponent } from './revision-jefe.component';

describe('revisionJefeComponent', () => {
  let component: revisionJefeComponent;
  let fixture: ComponentFixture<revisionJefeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [revisionJefeComponent]
    });
    fixture = TestBed.createComponent(revisionJefeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
