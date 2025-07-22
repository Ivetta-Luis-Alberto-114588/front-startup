import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';

import { GuestCheckoutService } from './guest-checkout.service';

describe('GuestCheckoutService', () => {
  let service: GuestCheckoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(GuestCheckoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
