import { TestBed } from '@angular/core/testing';

import { AdminTagService } from './admin-tag.service';

describe('AdminTagService', () => {
  let service: AdminTagService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminTagService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
