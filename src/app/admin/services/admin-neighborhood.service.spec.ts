import { TestBed } from '@angular/core/testing';

import { AdminNeighborhoodService } from './admin-neighborhood.service';

describe('AdminNeighborhoodService', () => {
  let service: AdminNeighborhoodService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminNeighborhoodService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
