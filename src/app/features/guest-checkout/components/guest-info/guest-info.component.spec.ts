import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestInfoComponent } from './guest-info.component';

describe('GuestInfoComponent', () => {
  let component: GuestInfoComponent;
  let fixture: ComponentFixture<GuestInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GuestInfoComponent]
    });
    fixture = TestBed.createComponent(GuestInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
