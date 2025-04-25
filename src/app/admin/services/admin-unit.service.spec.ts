import { TestBed } from '@angular/core/testing';

import { AdminUnitService } from './admin-unit.service';

describe('AdminUnitService', () => {
  let service: AdminUnitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminUnitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
