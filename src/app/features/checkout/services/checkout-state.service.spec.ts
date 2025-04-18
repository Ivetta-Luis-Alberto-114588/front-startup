import { TestBed } from '@angular/core/testing';

import { CheckoutStateService } from './checkout-state.service';

describe('CheckoutStateService', () => {
  let service: CheckoutStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CheckoutStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
