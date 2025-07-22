import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestCheckoutPageComponent } from './guest-checkout-page.component';

describe('GuestCheckoutPageComponent', () => {
  let component: GuestCheckoutPageComponent;
  let fixture: ComponentFixture<GuestCheckoutPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GuestCheckoutPageComponent]
    });
    fixture = TestBed.createComponent(GuestCheckoutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
