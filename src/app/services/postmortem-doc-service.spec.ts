import { TestBed } from '@angular/core/testing';

import { PostmortemDocService } from './postmortem-doc-service';

describe('PostmortemDocService', () => {
  let service: PostmortemDocService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostmortemDocService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
