import { TestBed } from '@angular/core/testing';

import { AdminCityService } from './admin-city.service';

describe('AdminCityService', () => {
  let service: AdminCityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminCityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
